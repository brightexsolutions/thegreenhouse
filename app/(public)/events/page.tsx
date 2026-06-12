import type { Metadata } from "next";
import Image from "next/image";
import { FadeIn } from "@/components/motion/fade-in";
import { EventGrid } from "@/components/events/event-grid";
import { createAdminClient } from "@/lib/supabase/server";
import type { Event } from "@/types/database";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Sessions",
  description:
    "All Green House sessions — past and upcoming. A cross-church worship and sharing evening in Nairobi.",
  alternates: { canonical: "/events" },
  openGraph: {
    title: "Sessions | The Green House",
    description: "Upcoming and past gatherings of The Green House, Nairobi.",
  },
};

async function getEvents(): Promise<Event[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("events")
      .select("*")
      .in("status", ["published", "live", "past"])
      .is("deleted_at", null)
      .order("event_date", { ascending: false });
    return (data as Event[]) ?? [];
  } catch {
    return [];
  }
}

export default async function EventsPage() {
  const events = await getEvents();
  const upcoming = events.filter((e) => e.status === "published" || e.status === "live");
  const past = events.filter((e) => e.status === "past");

  return (
    <>
      {/* Hero — photo background */}
      <section className="relative min-h-[55vh] flex items-end overflow-hidden pt-20">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1600&q=75"
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
            aria-hidden
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/85 to-forest/55" />
        </div>

        <div className="absolute top-20 right-32 w-48 h-48 rounded-full border border-cream/5 hidden lg:block" />
        <div className="absolute bottom-8 left-16 w-24 h-24 rounded-full border border-gold/10 hidden lg:block" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
          <FadeIn>
            <span className="label-caps text-gold/80">Sessions</span>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold text-cream mt-2 leading-[0.95]">
              Every gathering,
              <br />
              <em className="not-italic text-gold">worth remembering.</em>
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-5 text-cream/70 text-base sm:text-lg max-w-md leading-relaxed">
              Quarterly evenings of worship, prayer, and real conversation. No performance — just people.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Events */}
      <section className="py-16 md:py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {upcoming.length > 0 && (
            <div className="mb-16">
              <FadeIn>
                <div className="flex items-center gap-3 mb-8">
                  <span className="label-caps text-forest">Upcoming</span>
                  <div className="flex-1 h-px bg-mist" />
                  <span className="text-xs text-charcoal/40 font-medium">{upcoming.length} session{upcoming.length !== 1 ? "s" : ""}</span>
                </div>
              </FadeIn>
              <EventGrid events={upcoming} />
            </div>
          )}

          {past.length > 0 && (
            <div>
              <FadeIn>
                <div className="flex items-center gap-3 mb-8">
                  <span className="label-caps text-charcoal/40">Past Sessions</span>
                  <div className="flex-1 h-px bg-mist" />
                  <span className="text-xs text-charcoal/40 font-medium">{past.length} session{past.length !== 1 ? "s" : ""}</span>
                </div>
              </FadeIn>
              <EventGrid events={past} />
            </div>
          )}

          {events.length === 0 && (
            <FadeIn>
              <div className="text-center py-24">
                <div className="w-20 h-20 rounded-full bg-forest/5 border border-mist flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🌱</span>
                </div>
                <h3 className="font-display text-2xl font-semibold text-forest mb-2">
                  First session coming soon
                </h3>
                <p className="text-charcoal/50 text-sm max-w-xs mx-auto">
                  We&apos;re preparing something worth your evening. Stay close.
                </p>
              </div>
            </FadeIn>
          )}
        </div>
      </section>
    </>
  );
}
