import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const allowedTypes = ["video/mp4", "video/webm", "video/quicktime"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type. Upload MP4, WebM, or MOV." }, { status: 400 });
  }

  if (file.size > 100 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 100MB)" }, { status: 400 });
  }

  const ext  = file.type === "video/webm" ? "webm" : file.type === "video/quicktime" ? "mov" : "mp4";
  const path = `highlight-videos/${randomUUID()}.${ext}`;
  const adminSupa = createAdminClient();

  const buffer = await file.arrayBuffer();

  const { error } = await adminSupa.storage
    .from("event-images")
    .upload(path, buffer, {
      contentType: file.type,
      cacheControl: "3600",
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ path });
}
