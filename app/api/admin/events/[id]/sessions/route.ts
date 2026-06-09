import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

async function guard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? createAdminClient() : null;
}

export async function POST(req: NextRequest, { params }: Props) {
  const supabase = await guard();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: event_id } = await params;
  const { title, type, duration_min, notes, sort_order } = await req.json();

  const { data: session, error } = await supabase
    .from("event_sessions")
    .insert({ event_id, title, type: type ?? "other", duration_min: duration_min ?? null, notes: notes ?? null, sort_order: sort_order ?? 0 })
    .select("id, title, type, duration_min, notes, sort_order")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const supabase = await guard();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { reorder } = await req.json() as { reorder: Array<{ id: string; sort_order: number }> };

  await Promise.all(
    reorder.map(({ id, sort_order }) =>
      supabase.from("event_sessions").update({ sort_order }).eq("id", id)
    )
  );

  return NextResponse.json({ reordered: true });
}
