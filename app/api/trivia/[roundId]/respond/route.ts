import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// POST /api/trivia/[roundId]/respond — attendee submits their answer
export async function POST(req: NextRequest, { params }: { params: { roundId: string } }) {
  const supabase = createAdminClient();
  const { roundId } = params;

  const body = await req.json() as {
    answer_text:   string;
    answer_index?: number;  // MC only
    attendee_name?: string;
  };

  const { answer_text, answer_index, attendee_name } = body;
  if (!answer_text?.trim())
    return NextResponse.json({ error: "answer_text required" }, { status: 400 });

  // Fetch round + question to validate
  const { data: round } = await supabase
    .from("trivia_rounds")
    .select("id, status, trivia_questions(type, correct_index)")
    .eq("id", roundId)
    .single();

  if (!round) return NextResponse.json({ error: "Round not found" }, { status: 404 });
  if (round.status !== "active")
    return NextResponse.json({ error: "Round is no longer accepting answers" }, { status: 409 });

  const q = round.trivia_questions as { type: string; correct_index: number | null } | null;
  const isCorrect =
    q?.type === "multiple_choice" && answer_index != null
      ? answer_index === q.correct_index
      : null; // open_input: no right/wrong

  const { data, error } = await supabase
    .from("trivia_responses")
    .insert({
      round_id:      roundId,
      attendee_name: attendee_name?.trim() || null,
      answer_text:   answer_text.trim(),
      answer_index:  q?.type === "multiple_choice" ? (answer_index ?? null) : null,
      is_correct:    isCorrect,
    })
    .select("id, is_correct")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, is_correct: data.is_correct }, { status: 201 });
}
