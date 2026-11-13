import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { DeferredWidgets } from "@/components/layout/deferred-widgets";
import { createAdminClient } from "@/lib/supabase/server";
import { todayInNairobi } from "@/lib/utils";

async function getUpcomingEvent() {
  try {
    const supabase = createAdminClient({ revalidate: 60 });
    const { data } = await supabase
      .from("events")
      .select("slug, title, event_date, event_time, venue_name, venue_address, theme_title, theme_scripture, type, price_kes, status")
      .in("status", ["published", "live"])
      .is("deleted_at", null)
      .gte("event_date", todayInNairobi())
      .order("event_date", { ascending: true })
      .limit(1)
      .single();
    return data ?? null;
  } catch {
    return null;
  }
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const upcomingEvent = await getUpcomingEvent();
  const liveSlug = upcomingEvent?.status === "live" ? upcomingEvent.slug : undefined;

  return (
    <>
      <SiteNav liveSlug={liveSlug} />
      <main>{children}</main>
      <SiteFooter />
      <DeferredWidgets event={upcomingEvent} />
    </>
  );
}
