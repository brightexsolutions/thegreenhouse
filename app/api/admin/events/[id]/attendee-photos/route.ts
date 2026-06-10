import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

async function guard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? createAdminClient() : null;
}

export async function GET(_req: NextRequest, { params }: Props) {
  const supabase = await guard();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: eventId } = await params;
  const { data, error } = await supabase
    .from("attendee_photos")
    .select("id, storage_path, caption, submitted_by, file_size_kb, is_approved, show_on_site, created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Private bucket — generate 1-hour signed URLs for each photo
  const photos = await Promise.all(
    (data ?? []).map(async (photo) => {
      const { data: signed } = await supabase.storage
        .from("attendee-photos")
        .createSignedUrl((photo as { storage_path: string }).storage_path, 3600);
      return { ...photo, signed_url: signed?.signedUrl ?? null };
    })
  );

  return NextResponse.json({ photos });
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const supabase = await guard();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: eventId } = await params;
  const body = await req.json() as { photoId: string; is_approved?: boolean; show_on_site?: boolean };
  const { photoId, ...fields } = body;

  const patch: Record<string, boolean> = {};
  if (fields.is_approved  !== undefined) patch.is_approved  = fields.is_approved;
  if (fields.show_on_site !== undefined) patch.show_on_site = fields.show_on_site;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("attendee_photos")
    .update(patch)
    .eq("id", photoId)
    .eq("event_id", eventId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ updated: true });
}

export async function DELETE(req: NextRequest, { params }: Props) {
  const supabase = await guard();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: eventId } = await params;
  const { photoId } = await req.json() as { photoId: string };

  const { data: row } = await supabase
    .from("attendee_photos")
    .select("storage_path")
    .eq("id", photoId)
    .eq("event_id", eventId)
    .single();

  if (row?.storage_path) {
    await supabase.storage.from("attendee-photos").remove([row.storage_path]);
  }

  await supabase.from("attendee_photos").delete().eq("id", photoId);
  return NextResponse.json({ deleted: true });
}
