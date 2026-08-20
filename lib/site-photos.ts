import { createAdminClient } from "@/lib/supabase/server";

/**
 * Photographs for the marketing pages.
 *
 * These used to be hardcoded URLs: some pointing at Cloudinary, which was
 * deleted and took the pictures with it, and some at Unsplash stock of people
 * who have never been to a session. Both are the same mistake in different
 * clothes, a fixed reference to something outside the project's control.
 *
 * The gallery already holds real photographs of real gatherings in Supabase
 * Storage, uploaded through the admin panel. Reading from there means the
 * homepage refreshes itself as new sessions are photographed, and there is
 * nothing left to go stale.
 */

export interface SitePhoto {
  path:    string;
  caption: string | null;
}

/**
 * Gallery photographs, most recent session first.
 *
 * Returns an empty array rather than throwing: every caller has a designed
 * fallback, and a database hiccup should not take the homepage down.
 */
export async function getSitePhotos(limit = 12): Promise<SitePhoto[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("event_images")
      .select("path, caption, sort_order, events!inner(event_date, status, deleted_at)")
      .is("events.deleted_at", null)
      .in("events.status", ["published", "live", "past"])
      .order("event_date", { ascending: false, referencedTable: "events" })
      .order("sort_order", { ascending: true })
      .limit(limit);

    return (data ?? []).map(row => ({
      path:    (row as { path: string }).path,
      caption: (row as { caption: string | null }).caption,
    }));
  } catch {
    return [];
  }
}

/**
 * Spread a small pool across n slots without repeating until it has to.
 * The hero wants four distinct pictures; if only two exist, better to show
 * two and let the remaining tiles fall back than to show the same face twice.
 */
export function pickPhotos(photos: SitePhoto[], slots: number): Array<SitePhoto | null> {
  return Array.from({ length: slots }, (_, i) => photos[i] ?? null);
}
