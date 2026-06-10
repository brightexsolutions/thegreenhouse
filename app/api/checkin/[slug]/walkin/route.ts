import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, { params }: Props) {
  const { slug } = await params;

  const body = await req.json().catch(() => ({})) as {
    first_name?: string;
    last_name?:  string;
    phone?:      string;
    token?:      string;
  };

  const { first_name, last_name, phone, token } = body;

  if (!first_name?.trim() || !last_name?.trim() || !token) {
    return NextResponse.json({ error: "first_name, last_name and token are required" }, { status: 400 });
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

  const eventId = (event as { id: string }).id;

  const { data, error } = await supabase
    .from("registrations")
    .insert({
      event_id:     eventId,
      first_name:   first_name.trim(),
      last_name:    last_name.trim(),
      phone:        phone?.trim() || null,
      role:            "guest",
      source:          "other",
      is_walkin:       true,
      checked_in:      true,
      whatsapp_opt_in: false,
    })
    .select("id, first_name, last_name, phone, role, checked_in, is_walkin")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
