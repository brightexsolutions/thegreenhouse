import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, { params }: Props) {
  const { slug } = await params;
  const token = req.nextUrl.searchParams.get("t");
  if (!token) return NextResponse.json({ valid: false }, { status: 400 });

  const supabase = createAdminClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, control_token")
    .eq("slug", slug)
    .is("deleted_at", null)
    .single();

  if (!event) return NextResponse.json({ valid: false }, { status: 404 });

  const ev = event as { id: string; control_token: string | null };

  // Check granular control_links table first
  const { data: link } = await supabase
    .from("control_links")
    .select("permissions")
    .eq("event_id", ev.id)
    .eq("token", token)
    .maybeSingle();

  if (link) {
    return NextResponse.json({
      valid:       true,
      event_id:    ev.id,
      permissions: (link as { permissions: string[] }).permissions,
    });
  }

  // Fallback: legacy events.control_token → full access
  if (ev.control_token && ev.control_token === token) {
    return NextResponse.json({ valid: true, event_id: ev.id, permissions: ["full"] });
  }

  return NextResponse.json({ valid: false }, { status: 401 });
}
