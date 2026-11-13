import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// The response is the same for every caller (no token, no per-user data), so
// the CDN may share it briefly. A room of phones polling as a Realtime fallback
// then costs one database read every couple of seconds, not one per phone.
// Callers that need the latest state add a unique query string to skip it.
const SHARED_CACHE = { "Cache-Control": "public, s-maxage=2, stale-while-revalidate=4" };

// GET /api/trivia/[roundId] — public: fetch round + question
// Hides correct_index while still active; reveals it when status = revealing/closed
export async function GET(_: NextRequest, { params }: { params: { roundId: string } }) {
  const supabase = createAdminClient();
  const { data: round, error } = await supabase
    .from("trivia_rounds")
    .select("id, status, timer_seconds, started_at, revealed_at, question_id, trivia_questions(question, type, options, correct_index, hint, category, points)")
    .eq("id", params.roundId)
    .single();

  if (error || !round) return NextResponse.json({ error: "Round not found" }, { status: 404 });

  const q = round.trivia_questions as unknown as {
    question: string; type: string; options: string[] | null;
    correct_index: number | null; hint: string | null; category: string; points: number;
  } | null;

  // Only expose correct_index once revealing / closed
  const isRevealed = ["revealing", "closed"].includes(round.status);

  return NextResponse.json({
    id:            round.id,
    status:        round.status,
    timer_seconds: round.timer_seconds,
    started_at:    round.started_at,
    revealed_at:   round.revealed_at,
    question:      q?.question ?? "",
    type:          q?.type ?? "multiple_choice",
    options:       q?.options ?? null,
    hint:          q?.hint ?? null,
    category:      q?.category ?? "fun",
    points:        q?.points ?? 10,
    correct_index: isRevealed ? q?.correct_index : null,
  }, { headers: SHARED_CACHE });
}
