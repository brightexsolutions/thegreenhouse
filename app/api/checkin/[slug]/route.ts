import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkinLimiter } from "@/lib/rate-limit";

type Props = { params: Promise<{ slug: string }> };

function ip(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const { slug } = await params;

  try {
    await checkinLimiter.consume(ip(req));
  } catch {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { registration_id, checked_in, token } = await req.json();
  if (!registration_id || typeof checked_in !== "boolean" || !token) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Validate token
  const { data: event } = await supabase
    .from("events")
    .select("id, checkin_token")
    .eq("slug", slug)
    .is("deleted_at", null)
    .single();

  if (!event || (event as { checkin_token: string | null }).checkin_token !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  // Ensure registration belongs to this event
  const { error } = await supabase
    .from("registrations")
    .update({ checked_in, updated_at: new Date().toISOString() })
    .eq("id", registration_id)
    .eq("event_id", (event as { id: string }).id)
    .is("deleted_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
