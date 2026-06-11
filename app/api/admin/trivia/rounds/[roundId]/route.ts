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
      .select("id, status, started_at, revealed_at, timer_seconds, question_id, trivia_questions(question, type, options, correct_index, points)")
      .eq("id", roundId)
      .single(),
    supabase
      .from("trivia_responses")
      .select("answer_index, answer_text, is_correct, submitted_at")
      .eq("round_id", roundId),
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

// PATCH /api/admin/trivia/rounds/[roundId] — reveal or close the round
export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = createAdminClient();
  const { roundId } = params;
  const { action } = await req.json() as { action: "reveal" | "close" };

  if (!["reveal", "close"].includes(action))
    return NextResponse.json({ error: "action must be reveal or close" }, { status: 400 });

  const now = new Date().toISOString();
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

  // On close: clear trivia_round_id from display_state + go back to branding
  if (action === "close" && round?.event_id) {
    await supabase
      .from("display_state")
      .update({
        scene:           "branding",
        trivia_round_id: null,
        updated_at:      now,
      })
      .eq("event_id", round.event_id);
  }

  // On reveal: bump display_state updated_at so Realtime fires to attendees
  if (action === "reveal" && round?.event_id) {
    await supabase
      .from("display_state")
      .update({ updated_at: now })
      .eq("event_id", round.event_id);
  }

  return NextResponse.json({ round });
}
