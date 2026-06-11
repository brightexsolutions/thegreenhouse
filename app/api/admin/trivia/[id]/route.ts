import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// PUT /api/admin/trivia/[id] — update a question
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  const body = await req.json();
  const { question, type, options, correct_index, hint, category, points } = body;

  const patch: Record<string, unknown> = {};
  if (question?.trim())   patch.question      = question.trim();
  if (type)               patch.type          = type;
  if (options !== undefined) patch.options    = options;
  if (correct_index !== undefined) patch.correct_index = correct_index;
  if (hint !== undefined) patch.hint          = hint?.trim() || null;
  if (category)           patch.category      = category;
  if (points !== undefined) patch.points      = points;

  const { data, error } = await supabase
    .from("trivia_questions")
    .update(patch)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ question: data });
}

// DELETE /api/admin/trivia/[id] — soft delete
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("trivia_questions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
