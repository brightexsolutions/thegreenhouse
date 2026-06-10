import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

// Returns lightweight checked_in status for all registrations in the event.
// Token-gated — the checkin token is the credential (no admin login required).
export async function GET(req: NextRequest, { params }: Props) {
  const { slug } = await params;
  const token = req.nextUrl.searchParams.get("t");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const supabase = createAdminClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, checkin_token")
    .eq("slug", slug)
    .is("deleted_at", null)
    .single();

  if (!event || (event as { checkin_token: string | null }).checkin_token !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  const { data } = await supabase
    .from("registrations")
    .select("id, checked_in")
    .eq("event_id", (event as { id: string }).id)
    .is("deleted_at", null);

  return NextResponse.json({ statuses: data ?? [] }, {
    headers: { "Cache-Control": "no-store" },
  });
}
