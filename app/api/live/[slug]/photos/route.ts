import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { rateLimit } from "@/lib/rate-limit";
import { IMMUTABLE_CACHE } from "@/lib/storage";

type Props = { params: Promise<{ slug: string }> };

// 15MB raw, compressed down to roughly 200KB by sharp before it is stored.
const MAX_BYTES = 15 * 1024 * 1024;
// Supabase Storage is 1GB on the free tier. This endpoint is unauthenticated
// by design (attendees have no login), so it needs its own ceiling per event.
const MAX_PHOTOS_PER_EVENT = 400;

export async function POST(req: NextRequest, { params }: Props) {
  const limited = await rateLimit(req, "public");
  if (limited) return limited;

  const { slug } = await params;
  const supabase  = createAdminClient();

  // Look up event by slug
  const { data: event } = await supabase
    .from("events")
    .select("id, status")
    .eq("slug", slug)
    .is("deleted_at", null)
    .single();

  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // Photo sharing is a live-session feature. Outside the session there is no
  // reason for this to accept uploads, and leaving it open to any slug is how
  // a free storage tier gets filled.
  const ev = event as { id: string; status: string };
  if (ev.status !== "live") {
    return NextResponse.json(
      { error: "Photo sharing is only open while a session is running." },
      { status: 403 }
    );
  }

  const { count } = await supabase
    .from("attendee_photos")
    .select("id", { count: "exact", head: true })
    .eq("event_id", ev.id);

  if (count !== null && count >= MAX_PHOTOS_PER_EVENT) {
    return NextResponse.json(
      { error: "We have all the photos we can take for this session. Thank you." },
      { status: 429 }
    );
  }

  const formData = await req.formData();
  const file       = formData.get("file") as File | null;
  const caption    = (formData.get("caption") as string | null) ?? null;
  const submittedBy = (formData.get("submitted_by") as string | null) ?? null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, or WebP files are accepted." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({
      error: "That photo is over 15MB. Please pick a smaller one.",
    }, { status: 413 });
  }

  const raw = Buffer.from(await file.arrayBuffer());
  const compressed = await sharp(raw).rotate().resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
  const path = `attendees/${ev.id}/${randomUUID()}.jpg`;

  const { error: uploadErr } = await supabase.storage
    .from("attendee-photos")
    .upload(path, compressed, { contentType: "image/jpeg", cacheControl: IMMUTABLE_CACHE });

  if (uploadErr) {
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }

  const { error: dbErr } = await supabase.from("attendee_photos").insert({
    event_id:     ev.id,
    storage_path: path,
    caption:      caption?.trim() || null,
    submitted_by: submittedBy?.trim() || null,
    file_size_kb: Math.round(compressed.length / 1024),
    is_approved:  false,
    show_on_site: false,
  });

  if (dbErr) {
    await supabase.storage.from("attendee-photos").remove([path]);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
