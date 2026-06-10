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
  const body = await req.json() as { lyrics?: string; title?: string; artist?: string; vocalist?: string | null };

  // songId is a session_songs.id — look up the actual songs.id
  const { data: ss } = await supabase
    .from("session_songs")
    .select("song_id")
    .eq("id", songId)
    .single();

  if (!ss) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // vocalist lives on session_songs; lyrics/title/artist live on songs
  if (body.vocalist !== undefined) {
    const { error } = await supabase
      .from("session_songs")
      .update({ vocalist: body.vocalist ?? null })
      .eq("id", songId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const patch: Record<string, unknown> = {};
  if (body.lyrics !== undefined) patch.lyrics = body.lyrics;
  if (body.title  !== undefined) patch.title  = body.title;
  if (body.artist !== undefined) patch.artist = body.artist;

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from("songs").update(patch).eq("id", ss.song_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ updated: true });
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  const supabase = await guard();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { songId } = await params;
  const { error } = await supabase.from("session_songs").delete().eq("id", songId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
