import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function guard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? createAdminClient() : null;
}

export async function POST(req: NextRequest) {
  const supabase = await guard();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, artist, lyrics } = await req.json() as {
    title: string; artist?: string; lyrics?: string;
  };

  if (!title?.trim()) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }

  const { data: song, error } = await supabase
    .from("songs")
    .insert({
      title:  title.trim(),
      artist: artist?.trim() || null,
      lyrics: lyrics?.trim() || null,
    })
    .select("id, title, artist, lyrics, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ song }, { status: 201 });
}
