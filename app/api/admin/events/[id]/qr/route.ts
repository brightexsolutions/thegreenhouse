import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guard";
import QRCode from "qrcode";
import { SITE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Props) {
  const { id } = await params;
  const g = await requireAdmin();
  if (!g.ok) return g.response;

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
