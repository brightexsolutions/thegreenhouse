import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guard";
import { IMMUTABLE_CACHE } from "@/lib/storage";
import { randomUUID } from "crypto";
import sharp from "sharp";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  // Compress before storing. A phone photo straight off a camera roll is 5MB
  // to 10MB; at 1600px and quality 82 the same image lands around 200KB. The
  // storage bucket is 1GB total, so this is the difference between hundreds of
  // covers and a few dozen. Everything is normalised to JPEG because none of
  // these are transparent.
  const raw = Buffer.from(await file.arrayBuffer());
  let processed: Buffer;
  try {
    processed = await sharp(raw)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "That image could not be read. Try re-saving it." }, { status: 400 });
  }

  const path = `covers/${randomUUID()}.jpg`;
  const adminSupa = createAdminClient();

  const { error } = await adminSupa.storage
    .from("event-images")
    .upload(path, processed, {
      contentType: "image/jpeg",
      cacheControl: IMMUTABLE_CACHE,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ path, bytes: processed.length });
}
