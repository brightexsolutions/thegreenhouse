import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const NO_STORE = { "Cache-Control": "no-store" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(req: NextRequest, { params }: Props) {
  const { slug } = await params;

  const limited = await rateLimit(req, "checkin");
  if (limited) return limited;

  const body = await req.json().catch(() => null) as
    | { registration_id?: unknown; checked_in?: unknown; token?: unknown }
    | null;

  const registrationId = body?.registration_id;
  const checkedIn      = body?.checked_in;
  const token          = body?.token;

  if (
    typeof registrationId !== "string" || !UUID.test(registrationId) ||
    typeof checkedIn !== "boolean" ||
    typeof token !== "string" || !token
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400, headers: NO_STORE });
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

  // `.select()` makes the write report the row it changed. Without it an
  // update that matched nothing (a removed registrant, an id from another
  // event) still came back as a success and the volunteer saw "Present" for
  // someone the database never marked.
  const { data: updated, error } = await supabase
    .from("registrations")
    .update({ checked_in: checkedIn })
    .eq("id", registrationId)
    .eq("event_id", (event as { id: string }).id)
    .is("deleted_at", null)
    .select("id, checked_in")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Could not save. Try again." }, { status: 500, headers: NO_STORE });
  }
  if (!updated) {
    return NextResponse.json({ error: "This attendee is no longer on the list." }, { status: 404, headers: NO_STORE });
  }

  return NextResponse.json(
    { success: true, id: updated.id, checked_in: updated.checked_in },
    { headers: NO_STORE }
  );
}
