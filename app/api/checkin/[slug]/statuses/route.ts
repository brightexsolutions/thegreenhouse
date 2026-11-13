import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const NO_STORE = { "Cache-Control": "no-store" };

// Returns every registration for the event so each check-in device can stay in
// step with the others. The check-in token is the credential: no admin login.
export async function GET(req: NextRequest, { params }: Props) {
  const { slug } = await params;
  const token = req.nextUrl.searchParams.get("t");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400, headers: NO_STORE });

  const supabase = createAdminClient({ noStore: true });

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, checkin_token")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  // A database hiccup must not read as "invalid link": the panel treats 403
  // as final and tells the volunteer to ask for a new link.
  if (eventError) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503, headers: NO_STORE });
  }
  if (!event || (event as { checkin_token: string | null }).checkin_token !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403, headers: NO_STORE });
  }

  const { data, error } = await supabase
    .from("registrations")
    .select("id, first_name, last_name, email, phone, role, ticket_token, checked_in, is_walkin, photo_consent, created_at")
    .eq("event_id", (event as { id: string }).id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(2000);

  // Never answer a failed read with an empty list: the panel would take it as
  // "everyone was removed" and wipe the screen.
  if (error) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503, headers: NO_STORE });
  }

  return NextResponse.json({ registrants: data ?? [] }, { headers: NO_STORE });
}
