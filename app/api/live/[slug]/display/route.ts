import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guard";

type Props = { params: Promise<{ slug: string }> };

// The columns the control page writes. Anything else in the body is dropped,
// so a caller cannot repoint the row (id, event_id) or set trivia_round_id,
// which belongs to the trivia routes.
const DISPLAY_FIELDS = [
  "scene", "song_id", "session_song_id", "verse_index", "custom_text",
  "theme", "show_qr", "featured_feedback", "featured_feedback_author",
] as const;

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
    // Admin session auth (organizer using the control page while logged in).
    // A session alone is not enough: the account must still be an admin.
    const admin = await requireAdmin();
    if (admin.ok) authorized = true;
  }

  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const payload: Record<string, unknown> = {};
  for (const key of DISPLAY_FIELDS) {
    if (body[key] !== undefined) payload[key] = body[key];
  }

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
