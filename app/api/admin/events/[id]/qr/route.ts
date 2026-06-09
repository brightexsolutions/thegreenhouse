import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import QRCode from "qrcode";
import { SITE_URL } from "@/lib/constants";

type Props = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminSupa = createAdminClient();
  const { data: event } = await adminSupa.from("events").select("slug").eq("id", id).single();
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = `${SITE_URL}/events/${(event as { slug: string }).slug}`;
  const pngBuffer = await QRCode.toBuffer(url, {
    type: "png",
    width: 400,
    margin: 2,
    color: { dark: "#1b3a2a", light: "#f7f2e8" },
  });

  return new NextResponse(Buffer.from(pngBuffer) as unknown as BodyInit, {
    headers: {
      "Content-Type":  "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
