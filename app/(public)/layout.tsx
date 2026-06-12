import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SessionPromptDialog } from "@/components/layout/session-prompt-dialog";
import { createAdminClient } from "@/lib/supabase/server";

async function getUpcomingEvent() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("events")
      .select("slug, title, event_date, event_time, venue_name, theme_title, type, price_kes")
      .in("status", ["published", "live"])
      .is("deleted_at", null)
      .gte("event_date", new Date().toISOString().split("T")[0])
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

  return (
    <>
      <SiteNav />
      <main>{children}</main>
      <SiteFooter />
      {upcomingEvent && <SessionPromptDialog event={upcomingEvent} />}
    </>
  );
}
