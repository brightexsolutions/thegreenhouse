import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type TriviaQuestion = {
  id: string;
  question: string;
  type: string;
  options: string[] | null;
  correct_index: number | null;
  hint: string | null;
  category: string;
  points: number;
  created_at: string;
};

// GET /api/admin/trivia — list all questions
export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("trivia_questions")
    .select("id, question, type, options, correct_index, hint, category, points, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ questions: data ?? [] });
}

// POST /api/admin/trivia — create a question
export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const body = await req.json() as Partial<TriviaQuestion>;

  const { question, type, options, correct_index, hint, category, points } = body;
  if (!question?.trim()) return NextResponse.json({ error: "question required" }, { status: 400 });
  if (!type || !["multiple_choice", "open_input"].includes(type))
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  if (type === "multiple_choice") {
    if (!Array.isArray(options) || options.length < 2)
      return NextResponse.json({ error: "MC questions need at least 2 options" }, { status: 400 });
    if (correct_index == null || correct_index < 0 || correct_index >= options.length)
      return NextResponse.json({ error: "correct_index out of range" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("trivia_questions")
    .insert({
      question:      question.trim(),
      type,
      options:       type === "multiple_choice" ? options : null,
      correct_index: type === "multiple_choice" ? correct_index : null,
      hint:          hint?.trim() || null,
      category:      category ?? "fun",
      points:        points ?? 10,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ question: data }, { status: 201 });
}
