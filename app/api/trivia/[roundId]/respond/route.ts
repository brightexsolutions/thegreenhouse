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
    .select("id, status, trivia_questions(type, correct_index, correct_answer, answer_keywords)")
    .eq("id", roundId)
    .single();

  if (!round) return NextResponse.json({ error: "Round not found" }, { status: 404 });

  // Check for an existing response from this attendee for this round (prevent duplicates)
  if (attendee_name?.trim()) {
    const { data: existing } = await supabase
      .from("trivia_responses")
      .select("id, is_correct")
      .eq("round_id", roundId)
      .eq("attendee_name", attendee_name.trim())
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ ok: true, is_correct: existing.is_correct, already_submitted: true });
    }
  }

  // If the round is no longer active, still record the late answer but flag it
  const isLate = round.status !== "active";

  const q = round.trivia_questions as unknown as {
    type: string;
    correct_index: number | null;
    correct_answer: string | null;
    answer_keywords: string | null;
  } | null;

  let isCorrect: boolean | null = null;
  if (q?.type === "multiple_choice" && answer_index != null) {
    isCorrect = answer_index === q.correct_index;
  } else if (q?.type === "open_input" && answer_text) {
    // Keyword-based fuzzy match for open_input
    const normalized = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, "").trim();
    const responseNorm = normalized(answer_text);
    if (q.answer_keywords) {
      const keywords = q.answer_keywords.split(",").map(k => normalized(k)).filter(Boolean);
      if (keywords.length > 0) {
        isCorrect = keywords.every(kw => responseNorm.includes(kw));
      }
    } else if (q.correct_answer) {
      // Fallback: check if response contains ≥50% of words from correct answer
      const answerWords = normalized(q.correct_answer).split(/\s+/).filter(w => w.length > 2);
      if (answerWords.length > 0) {
        const matchCount = answerWords.filter(w => responseNorm.includes(w)).length;
        isCorrect = matchCount / answerWords.length >= 0.5;
      }
    }
    // If no reference answer provided, leave isCorrect null (admin reviews manually)
  }

  const { data, error } = await supabase
    .from("trivia_responses")
    .insert({
      round_id:      roundId,
      attendee_name: attendee_name?.trim() || null,
      answer_text:   answer_text.trim(),
      answer_index:  q?.type === "multiple_choice" ? (answer_index ?? null) : null,
      is_correct:    isLate ? null : isCorrect,  // late answers not auto-scored
    })
    .select("id, is_correct")
    .single();

  if (error) {
    // Unique violation (race condition duplicate) — return success silently
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, is_correct: null, already_submitted: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, is_correct: data.is_correct, late: isLate }, { status: 201 });
}
