import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string; sessionId: string; songId: string }> };

async function guard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? createAdminClient() : null;
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const supabase = await guard();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { songId } = await params;
  const body = await req.json() as {
    lyrics?: string; title?: string; artist?: string;
    vocalist?: string | null; item_text?: string;
  };

  const { data: ss } = await supabase
    .from("session_songs")
    .select("song_id")
    .eq("id", songId)
    .single();

  if (!ss) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Updates on session_songs row itself
  const ssPatch: Record<string, unknown> = {};
  if (body.vocalist  !== undefined) ssPatch.vocalist  = body.vocalist ?? null;
  if (body.item_text !== undefined) ssPatch.item_text = body.item_text;
  if (Object.keys(ssPatch).length > 0) {
    const { error } = await supabase.from("session_songs").update(ssPatch).eq("id", songId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Updates on the linked songs row (only if this is a song item with a valid song_id)
  const songPatch: Record<string, unknown> = {};
  if (body.lyrics !== undefined) songPatch.lyrics = body.lyrics;
  if (body.title  !== undefined) songPatch.title  = body.title;
  if (body.artist !== undefined) songPatch.artist = body.artist;

  const songId_ = (ss as { song_id: string | null }).song_id;
  if (Object.keys(songPatch).length > 0 && songId_) {
    const { error } = await supabase.from("songs").update(songPatch).eq("id", songId_);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ updated: true });
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  const supabase = await guard();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: eventId, songId } = await params;

  // Look up the actual song_id before deleting so we can check display_state
  const { data: ss } = await supabase
    .from("session_songs")
    .select("song_id")
    .eq("id", songId)
    .single();

  const { error } = await supabase.from("session_songs").delete().eq("id", songId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If this song was active on the display, switch to interlude so the screen
  // doesn't freeze on lyrics that no longer exist
  if (ss?.song_id) {
    const { data: ds } = await supabase
      .from("display_state")
      .select("song_id")
      .eq("event_id", eventId)
      .maybeSingle();

    if (ds && (ds as { song_id: string | null }).song_id === ss.song_id) {
      await supabase
        .from("display_state")
        .update({ song_id: null, scene: "interlude", verse_index: 0 })
        .eq("event_id", eventId);
    }
  }

  return NextResponse.json({ deleted: true });
}
