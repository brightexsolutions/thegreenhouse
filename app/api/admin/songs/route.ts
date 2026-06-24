import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function guard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? createAdminClient() : null;
}

export async function GET(req: NextRequest) {
  const supabase = await guard();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  let query = supabase
    .from("songs")
    .select("id, title, artist, lyrics, key")
    .is("deleted_at", null)
    .order("title", { ascending: true })
    .limit(30);

  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ songs: data ?? [] });
}

export async function DELETE(req: NextRequest) {
  const supabase = await guard();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json() as { id: string };
  await Promise.all([
    supabase.from("songs").update({ deleted_at: new Date().toISOString() }).eq("id", id),
    supabase.from("session_songs").delete().eq("song_id", id),
  ]);
  return NextResponse.json({ deleted: true });
}

export async function PATCH(req: NextRequest) {
  const supabase = await guard();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, title, artist, lyrics, key } = await req.json() as {
    id: string; title?: string; artist?: string; lyrics?: string; key?: string | null;
  };

  const patch: Record<string, unknown> = {};
  if (title  !== undefined) patch.title  = title;
  if (artist !== undefined) patch.artist = artist;
  if (lyrics !== undefined) patch.lyrics = lyrics;
  if (key    !== undefined) patch.key    = key || null;

  const { error } = await supabase.from("songs").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ updated: true });
}
