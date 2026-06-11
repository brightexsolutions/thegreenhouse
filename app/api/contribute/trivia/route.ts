import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/contribute/trivia?token=xxx — event info + questions already added
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const supabase = createAdminClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title, event_date, slug")
    .eq("trivia_contribution_token", token)
    .is("deleted_at", null)
    .single();

  if (!event) return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });

  const { data: questions } = await supabase
    .from("trivia_questions")
    .select("id, question, type, options, correct_index, correct_answer, category, points, created_at")
    .eq("event_id", event.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return NextResponse.json({ event, questions: questions ?? [] });
}

// POST /api/contribute/trivia?token=xxx — add a trivia question
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const supabase = createAdminClient();

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("trivia_contribution_token", token)
    .is("deleted_at", null)
    .single();

  if (!event) return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });

  const body = await req.json() as {
    question:       string;
    type:           "multiple_choice" | "open";
    options?:       string[];
    correct_index?: number;
    correct_answer?: string;
    category?:      string;
    points?:        number;
  };

  if (!body.question?.trim())
    return NextResponse.json({ error: "Question text is required" }, { status: 400 });

  if (body.type === "multiple_choice") {
    if (!body.options || body.options.length < 2)
      return NextResponse.json({ error: "At least 2 options required" }, { status: 400 });
    if (body.correct_index === undefined || body.correct_index < 0)
      return NextResponse.json({ error: "Correct option must be selected" }, { status: 400 });
  }

  // Normalize "open" → "open_input" (DB CHECK constraint requires 'open_input')
  const dbType = body.type === "open" ? "open_input" : body.type;
  const isOpen = dbType === "open_input";

  const { data, error } = await supabase
    .from("trivia_questions")
    .insert({
      event_id:       event.id,
      question:       body.question.trim(),
      type:           dbType,
      options:        !isOpen ? body.options : null,
      correct_index:  !isOpen ? body.correct_index : null,
      correct_answer: isOpen ? (body.correct_answer?.trim() || null) : null,
      category:       body.category?.trim() || "General",
      points:         body.points ?? 1,
    })
    .select("id, question, type, options, correct_index, category, points, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ question: data }, { status: 201 });
}

// DELETE /api/contribute/trivia?token=xxx&id=questionId — remove own question
export async function DELETE(req: NextRequest) {
  const token      = req.nextUrl.searchParams.get("token");
  const questionId = req.nextUrl.searchParams.get("id");
  if (!token || !questionId) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const supabase = createAdminClient();

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("trivia_contribution_token", token)
    .is("deleted_at", null)
    .single();

  if (!event) return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });

  await supabase
    .from("trivia_questions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", questionId)
    .eq("event_id", event.id);

  return NextResponse.json({ ok: true });
}
