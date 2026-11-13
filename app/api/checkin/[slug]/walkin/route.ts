import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { normalisePhone } from "@/lib/phone";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const NO_STORE = { "Cache-Control": "no-store" };
const COLUMNS = "id, first_name, last_name, email, phone, role, ticket_token, checked_in, is_walkin, photo_consent, created_at";

export async function POST(req: NextRequest, { params }: Props) {
  const limited = await rateLimit(req, "checkin");
  if (limited) return limited;

  const { slug } = await params;

  const body = await req.json().catch(() => ({})) as {
    first_name?:    unknown;
    last_name?:     unknown;
    phone?:         unknown;
    token?:         unknown;
    photo_consent?: unknown;
  };

  const firstName = typeof body.first_name === "string" ? body.first_name.trim().slice(0, 60) : "";
  const lastName  = typeof body.last_name  === "string" ? body.last_name.trim().slice(0, 60)  : "";
  const rawPhone  = typeof body.phone      === "string" ? body.phone.trim().slice(0, 24)      : "";
  const token     = typeof body.token      === "string" ? body.token : "";

  if (!firstName || !lastName || !token) {
    return NextResponse.json({ error: "First name and last name are required." }, { status: 400, headers: NO_STORE });
  }

  const supabase = createAdminClient({ noStore: true });

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, checkin_token")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (eventError) {
    return NextResponse.json({ error: "Could not reach the database. Try again." }, { status: 503, headers: NO_STORE });
  }
  if (!event || (event as { checkin_token: string | null }).checkin_token !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403, headers: NO_STORE });
  }

  const eventId = (event as { id: string }).id;
  const phone   = rawPhone ? normalisePhone(rawPhone) : null;

  const { data, error } = await supabase
    .from("registrations")
    .insert({
      event_id:        eventId,
      first_name:      firstName,
      last_name:       lastName,
      phone,
      role:            "guest",
      source:          "other",
      is_walkin:       true,
      checked_in:      true,
      whatsapp_opt_in: false,
      photo_consent:   body.photo_consent === true,
    })
    .select(COLUMNS)
    .single();

  if (!error) return NextResponse.json(data, { status: 201, headers: NO_STORE });

  // The phone number is already registered for this event: the person did
  // sign up, they just arrived without their ticket. Mark that registration
  // present instead of showing the volunteer a database error.
  if (error.code === "23505" && phone) {
    const { data: existing } = await supabase
      .from("registrations")
      .update({ checked_in: true })
      .eq("event_id", eventId)
      .eq("phone", phone)
      .is("deleted_at", null)
      .select(COLUMNS)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ...existing, already_registered: true }, { status: 200, headers: NO_STORE });
    }
  }

  return NextResponse.json({ error: "Could not add this person. Try again." }, { status: 500, headers: NO_STORE });
}
