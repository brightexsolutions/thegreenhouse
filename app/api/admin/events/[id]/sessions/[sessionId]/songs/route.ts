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
  const body = await req.json() as {
    songId?:    string;
    title?:     string;
    artist?:    string;
    lyrics?:    string;
    item_type?: string;
    item_text?: string;
  };

  // ── Text / quote / topic item ─────────────────────────────────────────────
  if (body.item_type && body.item_type !== "song") {
    const text = body.item_text?.trim();
    if (!text) return NextResponse.json({ error: "item_text required" }, { status: 400 });

    const { count } = await supabase
      .from("session_songs")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId);

    const { data: ss, error } = await supabase
      .from("session_songs")
      .insert({
        session_id: sessionId,
        song_id:    null,
        item_type:  body.item_type,
        item_text:  text,
        sort_order: count ?? 0,
      })
      .select("id, sort_order, item_type, item_text, vocalist")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ sessionSong: { ...ss, songs: null } }, { status: 201 });
  }

  // ── Song item (existing flow) ─────────────────────────────────────────────
  let songId: string;

  if (body.songId) {
    songId = body.songId;
  } else {
    const { title, artist, lyrics } = body;
    if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

    const { data: existing } = await supabase
      .from("songs")
      .select("id")
      .ilike("title", title)
      .eq("artist", artist ?? "")
      .is("deleted_at", null)
      .maybeSingle();

    if (existing) {
      songId = existing.id;
      if (lyrics) await supabase.from("songs").update({ lyrics }).eq("id", songId);
    } else {
      const { data: newSong, error } = await supabase
        .from("songs")
        .insert({ title, artist: artist ?? null, lyrics: lyrics ?? null })
        .select("id")
        .single();
      if (error || !newSong) return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
      songId = newSong.id;
    }
  }

  const { data: dup } = await supabase
    .from("session_songs")
    .select("id")
    .eq("session_id", sessionId)
    .eq("song_id", songId)
    .maybeSingle();
  if (dup) return NextResponse.json({ error: "This song is already in the session" }, { status: 409 });

  const { count } = await supabase
    .from("session_songs")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);

  const { data: ss, error: ssErr } = await supabase
    .from("session_songs")
    .insert({ session_id: sessionId, song_id: songId, item_type: "song", sort_order: count ?? 0 })
    .select("id, sort_order, item_type, item_text, vocalist, songs(id, title, artist, lyrics)")
    .single();

  if (ssErr) return NextResponse.json({ error: ssErr.message }, { status: 500 });
  return NextResponse.json({ sessionSong: ss }, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const supabase = await guard();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;
  const { reorder } = await req.json() as { reorder: { id: string; sort_order: number }[] };

  await Promise.all(
    reorder.map(({ id, sort_order }) =>
      supabase.from("session_songs").update({ sort_order }).eq("id", id).eq("session_id", sessionId)
    )
  );
  return NextResponse.json({ ok: true });
}
