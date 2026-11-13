import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

// The projection screen draws at most this many avatars.
const MAX_ATTENDEES = 40;

/**
 * Public, unauthenticated: the projection screen and the check-in stats bar
 * both read it. It therefore returns only what those two draw: the two
 * counts, and for the community scene a first name plus a last initial.
 * No full surnames and no registration ids.
 */
export async function GET(_req: NextRequest, { params }: Props) {
  const { slug } = await params;
  const supabase  = createAdminClient();

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("slug", slug)
    .is("deleted_at", null)
    .single();

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const eventId = (event as { id: string }).id;

  // Counts are done by the database (head: true sends no rows), so they are
  // not capped at the 1000 row page size and cost almost nothing.
  const [totalRes, presentRes, rowsRes] = await Promise.all([
    supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .is("deleted_at", null),
    supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("checked_in", true)
      .is("deleted_at", null),
    supabase
      .from("registrations")
      .select("id, first_name, last_name")
      .eq("event_id", eventId)
      .eq("checked_in", true)
      .is("deleted_at", null)
      .order("id")
      .limit(MAX_ATTENDEES),
  ]);

  const rows = (rowsRes.data ?? []) as Array<{ id: string; first_name: string | null; last_name: string | null }>;

  return NextResponse.json({
    total:   totalRes.count ?? 0,
    present: presentRes.count ?? 0,
    // Only checked-in attendees are shown in the community scene.
    attendees: rows.map(r => ({
      // Stable key for the avatar, not the registration id itself.
      id:         createHash("sha256").update(r.id).digest("hex").slice(0, 12),
      first_name: (r.first_name ?? "").trim(),
      // The screen only draws initials, so only the initial leaves the server.
      last_name:  (r.last_name ?? "").trim().charAt(0),
    })),
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
