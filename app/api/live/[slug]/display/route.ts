import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

// PATCH /api/live/[slug]/display?t=<token> — update display_state
// Accepts a control-link token OR an active admin session. Uses the service-role
// client so the write is never blocked by RLS (team members have no Supabase session).
export async function PATCH(req: NextRequest, { params }: Props) {
  const { slug } = await params;
  const token = req.nextUrl.searchParams.get("t");
  const adminSupabase = createAdminClient();

  // Look up the event — needed for both auth paths
  const { data: event } = await adminSupabase
    .from("events")
    .select("id, control_token")
    .eq("slug", slug)
    .is("deleted_at", null)
    .single();

  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  let authorized = false;

  if (token) {
    // Token auth: check granular control_links table first, then legacy column
    const { data: link } = await adminSupabase
      .from("control_links")
      .select("id")
      .eq("event_id", event.id)
      .eq("token", token)
      .maybeSingle();
    if (link) authorized = true;
    else if ((event as { id: string; control_token: string | null }).control_token === token) authorized = true;
  } else {
    // Admin session auth (organizer using the control page while logged in)
    const userSupabase = await createClient();
    const { data: { user } } = await userSupabase.auth.getUser();
    if (user) authorized = true;
  }

  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await req.json() as Record<string, unknown>;

  const { data, error } = await adminSupabase
    .from("display_state")
    .upsert(
      { ...payload, event_id: event.id, updated_at: new Date().toISOString() },
      { onConflict: "event_id" }
    )
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ display: data });
}
