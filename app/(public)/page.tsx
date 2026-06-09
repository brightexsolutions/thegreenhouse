import { HeroCollage }       from "@/components/home/hero-collage";
import { MarqueeStrip }      from "@/components/home/marquee-strip";
import { StatsStrip }        from "@/components/home/stats-strip";
import { EventTeaser }       from "@/components/home/event-teaser";
import { CommunityCircles }  from "@/components/home/community-circles";
import { createAdminClient } from "@/lib/supabase/server";
import type { Event } from "@/types/database";

export const revalidate = 300;

async function getNextEvent(): Promise<Event | null> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("events")
      .select("*")
      .in("status", ["published", "live"])
      .is("deleted_at", null)
      .order("event_date", { ascending: true })
      .limit(1)
      .single();
    return data ?? null;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const nextEvent = await getNextEvent();

  return (
    <>
      <HeroCollage />
      <MarqueeStrip />
      <StatsStrip />
      {nextEvent && <EventTeaser event={nextEvent} />}
      <CommunityCircles />
    </>
  );
}
