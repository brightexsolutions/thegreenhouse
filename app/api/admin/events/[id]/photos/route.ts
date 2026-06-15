import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import sharp from "sharp";

type Props = { params: Promise<{ id: string }> };

async function guard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? createAdminClient() : null;
}

export async function GET(_req: NextRequest, { params }: Props) {
  const supabase = await guard();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [{ data, error }, { data: storageItems }] = await Promise.all([
    supabase
      .from("event_images")
      .select("id, path, caption, sort_order, is_cover, created_at")
      .eq("event_id", id)
      .order("sort_order", { ascending: true }),
    supabase.storage.from("event-images").list(`events/${id}/gallery`, { limit: 1000 }),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Build filename → size_kb lookup from storage metadata
  const sizeByFilename: Record<string, number> = {};
  for (const obj of storageItems ?? []) {
    const sizeBytes = (obj.metadata as { size?: number } | null)?.size ?? 0;
    sizeByFilename[obj.name] = Math.round(sizeBytes / 1024);
  }

  const photos = (data ?? []).map(p => {
    const filename = p.path.split("/").pop() ?? "";
    return { ...p, size_kb: sizeByFilename[filename] ?? null };
  });

  return NextResponse.json({ photos });
}

export async function POST(req: NextRequest, { params }: Props) {
  const supabase = await guard();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: eventId } = await params;
  const formData = await req.formData();
  const file     = formData.get("file") as File | null;
  const caption  = (formData.get("caption") as string | null) ?? null;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, or WebP files are allowed" }, { status: 400 });
  }

  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 15MB)" }, { status: 400 });
  }

  const raw = Buffer.from(await file.arrayBuffer());

  // Auto-rotate per EXIF orientation, then compress
  const sharpInstance = sharp(raw).rotate().resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 80 });
  const compressed = await sharpInstance.toBuffer();
  const { width: compressedWidth, height: compressedHeight } = await sharp(compressed).metadata();

  const path = `events/${eventId}/gallery/${randomUUID()}.jpg`;

  const { error: uploadErr } = await supabase.storage
    .from("event-images")
    .upload(path, compressed, { contentType: "image/jpeg", cacheControl: "3600" });

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  // Get current max sort_order
  const { count } = await supabase
    .from("event_images")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);

  const { data: row, error: dbErr } = await supabase
    .from("event_images")
    .insert({ event_id: eventId, path, caption, sort_order: count ?? 0, is_cover: false })
    .select("id, path, caption, sort_order, is_cover, created_at")
    .single();

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({
    photo: row,
    meta: {
      width:   compressedWidth  ?? null,
      height:  compressedHeight ?? null,
      size_kb: Math.round(compressed.length / 1024),
    },
  }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: Props) {
  const supabase = await guard();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: eventId } = await params;
  const { photoId } = await req.json() as { photoId: string };

  // Get path to delete from storage
  const { data: row } = await supabase
    .from("event_images")
    .select("path")
    .eq("id", photoId)
    .eq("event_id", eventId)
    .single();

  if (row?.path) {
    await supabase.storage.from("event-images").remove([row.path]);
  }

  await supabase.from("event_images").delete().eq("id", photoId);
  return NextResponse.json({ deleted: true });
}
