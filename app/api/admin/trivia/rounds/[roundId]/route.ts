import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = { params: { roundId: string } };

// GET /api/admin/trivia/rounds/[roundId] — get results + breakdown
export async function GET(_: NextRequest, { params }: Params) {
  const supabase = createAdminClient();
  const { roundId } = params;

  const [{ data: round }, { data: responses }] = await Promise.all([
    supabase
      .from("trivia_rounds")
      .select("id, status, started_at, revealed_at, timer_seconds, question_id, trivia_questions(question, type, options, correct_index, points, hint, correct_answer, answer_keywords)")
      .eq("id", roundId)
      .single(),
    supabase
      .from("trivia_responses")
      .select("id, answer_index, answer_text, is_correct, admin_override, submitted_at, attendee_name")
      .eq("round_id", roundId)
      .order("submitted_at", { ascending: true }),
  ]);

  if (!round) return NextResponse.json({ error: "Round not found" }, { status: 404 });

  const totalResponses = responses?.length ?? 0;
  const correctCount   = responses?.filter(r => r.is_correct).length ?? 0;

  // Tally per option (for MC)
  const tally: Record<number, number> = {};
  for (const r of responses ?? []) {
    if (r.answer_index != null) tally[r.answer_index] = (tally[r.answer_index] ?? 0) + 1;
  }

  return NextResponse.json({
    round,
    totalResponses,
    correctCount,
    tally,
    responses: responses ?? [],
  });
}

// PATCH /api/admin/trivia/rounds/[roundId] — reveal, close, dismiss, or finalize
export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = createAdminClient();
  const { roundId } = params;
  const body = await req.json() as { action: "reveal" | "close" | "dismiss" | "finalize"; event_id?: string };
  const { action } = body;

  if (!["reveal", "close", "dismiss", "finalize"].includes(action))
    return NextResponse.json({ error: "action must be reveal, close, dismiss, or finalize" }, { status: 400 });

  const now = new Date().toISOString();

  // "dismiss" — clear the current round but keep the trivia scene so the display shows
  //             "Trivia loading…" while the operator picks the next question
  if (action === "dismiss") {
    const { data: round } = await supabase
      .from("trivia_rounds")
      .select("id, event_id")
      .eq("id", roundId)
      .single();
    if (round?.event_id) {
      await supabase
        .from("display_state")
        .update({ scene: "trivia", trivia_round_id: null, custom_text: null, updated_at: now })
        .eq("event_id", round.event_id);
    }
    return NextResponse.json({ ok: true });
  }

  // "finalize" — show aggregate final leaderboard on display
  if (action === "finalize") {
    const eventId = body.event_id;
    if (eventId) {
      await supabase
        .from("display_state")
        .update({ scene: "trivia", trivia_round_id: null, custom_text: "__final_leaderboard__", updated_at: now })
        .eq("event_id", eventId);
    }
    // Also close the current round
    await supabase
      .from("trivia_rounds")
      .update({ status: "closed", closed_at: now })
      .eq("id", roundId);
    return NextResponse.json({ ok: true });
  }

  const patch =
    action === "reveal"
      ? { status: "revealing", revealed_at: now }
      : { status: "closed",   closed_at:   now };

  const { data: round, error } = await supabase
    .from("trivia_rounds")
    .update(patch)
    .eq("id", roundId)
    .select("id, status, event_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // On close: keep trivia scene + trivia_round_id so leaderboard stays on display
  // Just bump updated_at so Realtime fires and the display knows round is now closed
  if ((action === "reveal" || action === "close") && round?.event_id) {
    await supabase
      .from("display_state")
      .update({ updated_at: now })
      .eq("event_id", round.event_id);
  }

  return NextResponse.json({ round });
}
