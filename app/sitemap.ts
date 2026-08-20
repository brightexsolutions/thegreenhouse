import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/constants";

// Short revalidate so a post published in the admin panel appears in the
// sitemap within minutes, not on the next deploy.
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let events: Array<{ slug: string; updated_at: string }> = [];
  let posts:  Array<{ slug: string; updated_at: string; published_at: string | null }> = [];

  try {
    const supabase = createAdminClient();
    const [eventRes, postRes] = await Promise.all([
      supabase
        .from("events")
        .select("slug, updated_at")
        .in("status", ["published", "live", "past"])
        .is("deleted_at", null),
      supabase
        .from("blog_posts")
        .select("slug, updated_at, published_at")
        .eq("status", "published")
        .is("deleted_at", null)
        .order("published_at", { ascending: false }),
    ]);
    events = (eventRes.data ?? []) as typeof events;
    posts  = (postRes.data  ?? []) as typeof posts;
  } catch {
    // A database outage should still produce a valid sitemap of static routes.
  }

  // The newest post drives the blog index lastmod, which is the signal that
  // tells a crawler the section is worth re-reading.
  const newestPost = posts[0];

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL,                   lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${SITE_URL}/about`,        lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/events`,       lastModified: new Date(), changeFrequency: "weekly",  priority: 0.9 },
    {
      url:             `${SITE_URL}/blog`,
      lastModified:    newestPost ? new Date(newestPost.updated_at) : new Date(),
      changeFrequency: "daily",
      priority:        0.9,
    },
    { url: `${SITE_URL}/gallery`,      lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/get-involved`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  const eventRoutes: MetadataRoute.Sitemap = events.map(e => ({
    url:             `${SITE_URL}/events/${e.slug}`,
    lastModified:    new Date(e.updated_at),
    changeFrequency: "weekly" as const,
    priority:        0.85,
  }));

  // The most recent post gets the highest post priority so it is the one
  // crawlers reach for first.
  const postRoutes: MetadataRoute.Sitemap = posts.map((p, i) => ({
    url:             `${SITE_URL}/blog/${p.slug}`,
    lastModified:    new Date(p.updated_at),
    changeFrequency: i === 0 ? ("daily" as const) : ("monthly" as const),
    priority:        i === 0 ? 0.9 : 0.7,
  }));

  return [...staticRoutes, ...eventRoutes, ...postRoutes];
}
