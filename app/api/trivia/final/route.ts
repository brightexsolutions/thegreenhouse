import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/trivia/final?event_id=xxx — aggregate leaderboard across all rounds for an event
export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get("event_id");
  if (!eventId) return NextResponse.json({ error: "event_id required" }, { status: 400 });

  const supabase = createAdminClient();

  // Fetch all correct responses for rounds belonging to this event
  const { data: responses } = await supabase
    .from("trivia_responses")
    .select("attendee_name, is_correct, submitted_at, round_id, trivia_rounds!inner(event_id)")
    .eq("trivia_rounds.event_id", eventId)
    .eq("is_correct", true);

  // Aggregate by attendee name
  const tally = new Map<string, { correct: number; lastAt: string }>();
  for (const r of responses ?? []) {
    const name = r.attendee_name || "Anonymous";
    const prev = tally.get(name);
    if (!prev) {
      tally.set(name, { correct: 1, lastAt: r.submitted_at });
    } else {
      prev.correct += 1;
      if (r.submitted_at > prev.lastAt) prev.lastAt = r.submitted_at;
    }
  }

  const rankings = Array.from(tally.entries())
    .map(([name, { correct, lastAt }]) => ({ name, correct, lastAt }))
    .sort((a, b) => b.correct - a.correct || a.lastAt.localeCompare(b.lastAt))
    .slice(0, 10)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  // Total unique players (correct or not)
  const { data: allResponses } = await supabase
    .from("trivia_responses")
    .select("attendee_name, trivia_rounds!inner(event_id)")
    .eq("trivia_rounds.event_id", eventId);

  const totalPlayers = new Set((allResponses ?? []).map(r => r.attendee_name || "Anonymous")).size;
  const totalRounds  = new Set((responses ?? []).map(r => r.round_id)).size;

  return NextResponse.json({ rankings, totalPlayers, totalRounds });
}
