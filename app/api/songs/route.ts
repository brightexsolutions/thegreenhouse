import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET /api/songs?token=xxx  — return event info + all songs
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const supabase = createAdminClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title, event_date, slug")
    .eq("song_submission_token", token)
    .is("deleted_at", null)
    .single();

  if (!event) return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });

  const { data: songs } = await supabase
    .from("songs")
    .select("id, title, artist, lyrics, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return NextResponse.json({ event, songs: songs ?? [] });
}

// POST /api/songs?token=xxx — submit a new song
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const supabase = createAdminClient();

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("song_submission_token", token)
    .is("deleted_at", null)
    .single();

  if (!event) return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });

  const body = await req.json() as { title?: string; artist?: string; lyrics?: string };
  const title = body.title?.trim();
  if (!title) return NextResponse.json({ error: "Song title is required" }, { status: 400 });

  // Check for duplicate title (case-insensitive)
  const { data: existing } = await supabase
    .from("songs")
    .select("id, title, artist")
    .ilike("title", title)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "A song with this title already exists", existing }, { status: 409 });
  }

  const { data: song, error } = await supabase
    .from("songs")
    .insert({
      title,
      artist: body.artist?.trim() || null,
      lyrics: body.lyrics?.trim() || null,
    })
    .select("id, title, artist, lyrics, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ song }, { status: 201 });
}
