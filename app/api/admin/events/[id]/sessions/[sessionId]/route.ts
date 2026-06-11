import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string; sessionId: string }> };

async function guard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? createAdminClient() : null;
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const supabase = await guard();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;
  const patch = await req.json();

  const allowed = ["title", "type", "duration_min", "notes", "sort_order", "trivia_question_id"] as const;
  type AllowedKey = typeof allowed[number];
  const safe = Object.fromEntries(
    Object.entries(patch).filter(([k]) => (allowed as readonly string[]).includes(k))
  ) as Pick<{ [K in AllowedKey]: unknown }, AllowedKey>;

  const { error } = await supabase.from("event_sessions").update(safe).eq("id", sessionId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ updated: true });
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  const supabase = await guard();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;
  const { error } = await supabase
    .from("event_sessions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
