import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

  const q = round.trivia_questions as {
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
  });
}
