import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

type Props = { params: Promise<{ slug: string }> };

const MAX_BYTES = 2 * 1024 * 1024; // 2MB

export async function POST(req: NextRequest, { params }: Props) {
  const { slug } = await params;
  const supabase  = createAdminClient();

  // Look up event by slug
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("slug", slug)
    .is("deleted_at", null)
    .single();

  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

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
      error: "Photo is too large. Please resize it to under 2MB before sharing.",
    }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const path   = `attendees/${event.id}/${randomUUID()}.jpg`;

  const { error: uploadErr } = await supabase.storage
    .from("attendee-photos")
    .upload(path, buffer, { contentType: file.type, cacheControl: "3600" });

  if (uploadErr) {
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }

  const { error: dbErr } = await supabase.from("attendee_photos").insert({
    event_id:     event.id,
    storage_path: path,
    caption:      caption?.trim() || null,
    submitted_by: submittedBy?.trim() || null,
    file_size_kb: Math.round(file.size / 1024),
    is_approved:  false,
    show_on_site: false,
  });

  if (dbErr) {
    await supabase.storage.from("attendee-photos").remove([path]);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
