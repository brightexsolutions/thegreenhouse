import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guard";
import { IMMUTABLE_CACHE } from "@/lib/storage";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const allowedTypes = ["video/mp4", "video/webm", "video/quicktime"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type. Upload MP4, WebM, or MOV." }, { status: 400 });
  }

  // 100MB filled a quarter of the 1GB bucket per upload. Long-form worship
  // recordings belong on YouTube; this path is for short clips only.
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({
      error: "Videos over 25MB should go on YouTube. Paste the YouTube link on the event instead.",
    }, { status: 400 });
  }

  const ext  = file.type === "video/webm" ? "webm" : file.type === "video/quicktime" ? "mov" : "mp4";
  const path = `highlight-videos/${randomUUID()}.${ext}`;
  const adminSupa = createAdminClient();

  const buffer = await file.arrayBuffer();

  const { error } = await adminSupa.storage
    .from("event-images")
    .upload(path, buffer, {
      contentType: file.type,
      cacheControl: IMMUTABLE_CACHE,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ path });
}
