import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// The response is the same for every caller (no token, no per-user data), so
// the CDN may share it briefly. A room of phones polling as a Realtime fallback
// then costs one database read every couple of seconds, not one per phone.
// Callers that need the latest state add a unique query string to skip it.
const SHARED_CACHE = { "Cache-Control": "public, s-maxage=2, stale-while-revalidate=4" };

// GET /api/trivia/[roundId]/results — live response counts (safe to expose publicly)
// Returns totals + per-option tally; does NOT reveal correct answer (use main GET for that)
export async function GET(_: NextRequest, { params }: { params: { roundId: string } }) {
  const supabase = createAdminClient();

  const [{ data: round }, { data: responses }] = await Promise.all([
    supabase
      .from("trivia_rounds")
      .select("id, status, timer_seconds, started_at")
      .eq("id", params.roundId)
      .single(),
    supabase
      .from("trivia_responses")
      .select("answer_index, is_correct, submitted_at, attendee_name")
      .eq("round_id", params.roundId)
      .order("submitted_at", { ascending: true }),
  ]);

  if (!round) return NextResponse.json({ error: "Round not found" }, { status: 404 });

  const total   = responses?.length ?? 0;
  const correct = responses?.filter(r => r.is_correct === true).length ?? 0;

  // Per-option tally (MC)
  const tally: Record<number, number> = {};
  for (const r of responses ?? []) {
    if (r.answer_index != null) tally[r.answer_index] = (tally[r.answer_index] ?? 0) + 1;
  }

  // Respondent list: correct answers only, ordered by submission time
  const respondents = (responses ?? [])
    .filter(r => r.is_correct === true)
    .map(r => ({
      name:         r.attendee_name || null,
      submitted_at: r.submitted_at,
      is_correct:   true as const,
    }));

  return NextResponse.json({ status: round.status, total, correct, tally, respondents }, { headers: SHARED_CACHE });
}
