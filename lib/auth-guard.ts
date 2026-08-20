import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/** Result of an admin guard: either the caller is an admin and we hand back a
 *  service-role client, or we hand back the response to return immediately. */
export type AdminGuard =
  | { ok: true;  supabase: SupabaseClient; userId: string; role: string }
  | { ok: false; response: NextResponse };

/**
 * Gate an API route on a real admin account.
 *
 * The middleware matcher is `/admin/:path*`, which does not cover
 * `/api/admin/*`. Every admin API route therefore has to check for itself,
 * and checking only `auth.getUser()` is not enough: an account whose
 * admin_profiles row has been deleted still has a valid session. Both
 * conditions belong in one place so a new route cannot get half of it.
 */
export async function requireAdmin(opts?: { superAdmin?: boolean }): Promise<AdminGuard> {
  const cookieClient = await createClient();
  const { data: { user } } = await cookieClient.auth.getUser();

  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  // No profile means the account was removed from the admin list. The auth
  // session may still be valid, so this has to be an explicit check.
  if (!profile) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const role = (profile as { role: string }).role;

  if (opts?.superAdmin && role !== "super_admin") {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true, supabase, userId: user.id, role };
}

export type ControlPermission = "full" | "music" | "scenes" | "trivia" | "feedback";

export type ControlGuard =
  | { ok: true;  supabase: SupabaseClient; eventId: string; via: "admin" | "token" }
  | { ok: false; response: NextResponse };

/**
 * Gate a route that the live control panel uses.
 *
 * The worship leader running a session is usually not a logged in admin: they
 * open /live/[slug]/control with a `?t=` control-link token. So these routes
 * have to accept either an admin session or a token that carries the right
 * permission for that specific event. Requiring an admin session alone would
 * break the room; accepting anything at all is what left the trivia endpoints
 * open to the internet.
 */
export async function requireAdminOrControlToken(
  eventLookup: { slug: string } | { eventId: string },
  permission: ControlPermission,
  token: string | null
): Promise<ControlGuard> {
  const supabase = createAdminClient();

  const query = supabase.from("events").select("id, control_token").is("deleted_at", null);
  const { data: event } = await ("slug" in eventLookup
    ? query.eq("slug", eventLookup.slug)
    : query.eq("id", eventLookup.eventId)
  ).maybeSingle();

  if (!event) {
    return { ok: false, response: NextResponse.json({ error: "Event not found" }, { status: 404 }) };
  }
  const ev = event as { id: string; control_token: string | null };

  if (token) {
    const { data: link } = await supabase
      .from("control_links")
      .select("permissions")
      .eq("event_id", ev.id)
      .eq("token", token)
      .maybeSingle();

    if (link) {
      const perms = (link as { permissions: string[] }).permissions ?? [];
      if (perms.includes("full") || perms.includes(permission)) {
        return { ok: true, supabase, eventId: ev.id, via: "token" };
      }
      // A real token, but not scoped to this job.
      return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }

    // Legacy events.control_token grants everything.
    if (ev.control_token && ev.control_token === token) {
      return { ok: true, supabase, eventId: ev.id, via: "token" };
    }

    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const admin = await requireAdmin();
  if (!admin.ok) return { ok: false, response: admin.response };
  return { ok: true, supabase, eventId: ev.id, via: "admin" };
}

/**
 * Same as requireAdminOrControlToken, for routes addressed by trivia round id
 * rather than event slug. Resolves the round to its event first so the token
 * is checked against the event it actually belongs to, not just any event.
 */
export async function requireTriviaRoundAccess(
  roundId: string,
  token: string | null
): Promise<ControlGuard> {
  const lookup = createAdminClient();
  const { data: round } = await lookup
    .from("trivia_rounds")
    .select("event_id")
    .eq("id", roundId)
    .maybeSingle();

  if (!round) {
    return { ok: false, response: NextResponse.json({ error: "Round not found" }, { status: 404 }) };
  }

  return requireAdminOrControlToken(
    { eventId: (round as { event_id: string }).event_id },
    "trivia",
    token
  );
}
