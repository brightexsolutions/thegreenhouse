import { HeroCollage }      from "@/components/home/hero-collage";
import { MarqueeStrip }     from "@/components/home/marquee-strip";
import { StatsStrip }       from "@/components/home/stats-strip";
import { WhatHappens }      from "@/components/home/what-happens";
import { VisionCards }      from "@/components/about/vision-cards";
import { EventTeaser }      from "@/components/home/event-teaser";
import { GetInvolvedCta }      from "@/components/home/get-involved-cta";
import { CommunityCircles }   from "@/components/home/community-circles";
import { SessionHighlight }   from "@/components/home/session-highlight";
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
      {/* 1 — Hero with 4-card floating collage */}
      <HeroCollage />

      {/* Thin identity strip */}
      <MarqueeStrip />
      <StatsStrip entryDisplay={
        nextEvent
          ? nextEvent.type === "paid" && nextEvent.price_kes
            ? `KES ${nextEvent.price_kes.toLocaleString()}`
            : nextEvent.type === "paid" ? "Paid" : "Free"
          : "Free"
      } />

      {/* 2 — What a session feels like (image + text) */}
      <WhatHappens />

      {/* 3 — What makes it different (4 pillars) */}
      <VisionCards />

      {/* 4 — Session highlight video */}
      <SessionHighlight />

      {/* 5 — Next session countdown */}
      {nextEvent && <EventTeaser event={nextEvent} />}

      {/* 5 — Get involved CTA */}
      <GetInvolvedCta />

      {/* Separator */}
      <div className="flex items-center justify-center gap-4 py-2 bg-cream">
        <div className="h-px w-24 bg-gradient-to-r from-transparent to-gold/30" />
        <div className="w-1.5 h-1.5 rounded-full bg-gold/40" />
        <div className="w-1 h-1 rounded-full bg-gold/25" />
        <div className="w-1.5 h-1.5 rounded-full bg-gold/40" />
        <div className="h-px w-24 bg-gradient-to-l from-transparent to-gold/30" />
      </div>

      {/* 6 — Community circles */}
      <CommunityCircles />
    </>
  );
}
