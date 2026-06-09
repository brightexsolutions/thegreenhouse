import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let events: Array<{ slug: string; updated_at: string }> | null = null;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("events")
      .select("slug, updated_at")
      .in("status", ["published", "live", "past"])
      .is("deleted_at", null);
    events = data as typeof events;
  } catch {
    events = null;
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL,                    lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${SITE_URL}/about`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/events`,        lastModified: new Date(), changeFrequency: "weekly",  priority: 0.9 },
    { url: `${SITE_URL}/gallery`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/get-involved`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  const eventRoutes: MetadataRoute.Sitemap = (events ?? []).map((e: { slug: string; updated_at: string }) => ({
    url:             `${SITE_URL}/events/${e.slug}`,
    lastModified:    new Date(e.updated_at),
    changeFrequency: "weekly" as const,
    priority:        0.85,
  }));

  return [...staticRoutes, ...eventRoutes];
}
