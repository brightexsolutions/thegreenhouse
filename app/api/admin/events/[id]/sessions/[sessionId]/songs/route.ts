import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string; sessionId: string }> };

async function guard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? createAdminClient() : null;
}

export async function POST(req: NextRequest, { params }: Props) {
  const supabase = await guard();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;
  const { title, artist, lyrics } = await req.json() as { title: string; artist?: string; lyrics?: string };

  // Upsert song in library (search by title+artist first)
  const { data: existing } = await supabase
    .from("songs")
    .select("id")
    .ilike("title", title)
    .eq("artist", artist ?? "")
    .maybeSingle();

  let songId: string;
  if (existing) {
    songId = existing.id;
    if (lyrics) {
      await supabase.from("songs").update({ lyrics }).eq("id", songId);
    }
  } else {
    const { data: newSong, error } = await supabase
      .from("songs")
      .insert({ title, artist: artist ?? null, lyrics: lyrics ?? null })
      .select("id")
      .single();
    if (error || !newSong) return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
    songId = newSong.id;
  }

  // Get current max sort_order for this session
  const { count } = await supabase
    .from("session_songs")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);

  const { data: ss, error: ssErr } = await supabase
    .from("session_songs")
    .insert({ session_id: sessionId, song_id: songId, sort_order: count ?? 0 })
    .select("id, sort_order, songs(id, title, artist, lyrics)")
    .single();

  if (ssErr) return NextResponse.json({ error: ssErr.message }, { status: 500 });
  return NextResponse.json({ sessionSong: ss }, { status: 201 });
}
