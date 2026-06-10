import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Calendar, Clock, MapPin, ExternalLink, Music2, BookOpen, History, Radio } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { storageUrl, SITE_URL, SITE_NAME } from "@/lib/constants";
import { FadeIn } from "@/components/motion/fade-in";
import { RegistrationModal } from "@/components/events/registration-modal";
import type { Event } from "@/types/database";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

async function getEvent(slug: string): Promise<Event | null> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .is("deleted_at", null)
      .single();
    return (data as Event) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return {};

  const coverUrl = event.cover_image
    ? storageUrl(`event-images/${event.cover_image}`, { width: 1200 })
    : undefined;

  const formattedDate = new Date(event.event_date).toLocaleDateString("en-KE", {
    day: "numeric", month: "long", year: "numeric",
  });

  return {
    title: event.title,
    description: event.description ?? `${event.title} — a cross-church worship evening in Nairobi on ${formattedDate}.`,
    alternates: { canonical: `/events/${slug}` },
    openGraph: {
      title: event.title,
      description: event.description ?? `${event.title} — ${formattedDate}`,
      url: `${SITE_URL}/events/${slug}`,
      type: "website",
      ...(coverUrl ? { images: [{ url: coverUrl, width: 1200, alt: event.title }] } : {}),
    },
  };
}

export async function generateStaticParams() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("events")
      .select("slug")
      .in("status", ["published", "live", "past"])
      .is("deleted_at", null);
    return (data ?? []).map((e: { slug: string }) => ({ slug: e.slug }));
  } catch {
    return [];
  }
}

function jsonLd(event: Event) {
  const base = {
    "@context": "https://schema.org",
    "@type":    "Event",
    name:       event.title,
    description: event.description ?? event.subtitle ?? undefined,
    startDate:  `${event.event_date}T${event.event_time}`,
    eventStatus: event.status === "cancelled"
      ? "https://schema.org/EventCancelled"
      : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    isAccessibleForFree: event.type === "free",
    organizer: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    ...(event.venue_name
      ? {
          location: {
            "@type": "Place",
            name:    event.venue_name,
            ...(event.venue_address ? { address: event.venue_address } : {}),
          },
        }
      : {}),
    ...(event.cover_image
      ? { image: storageUrl(`event-images/${event.cover_image}`, { width: 1200 }) }
      : {}),
  };
  return JSON.stringify(base);
}

// Fallback hero photos when event has no cover image
const HERO_FALLBACKS = [
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&w=1600&q=80",
];
function pickHeroFallback(slug: string) {
  const hash = slug.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return HERO_FALLBACKS[hash % HERO_FALLBACKS.length];
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const coverUrl = event.cover_image
    ? storageUrl(`event-images/${event.cover_image}`, { width: 1600, quality: 85 })
    : pickHeroFallback(event.slug);

  const formattedDate = new Date(event.event_date).toLocaleDateString("en-KE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const time = event.event_time.slice(0, 5).replace(":", ".");

  const isOpen = event.status === "published" || event.status === "live";

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(event) }} />

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-end overflow-hidden pt-20">
        {/* BG photo — always present */}
        <div className="absolute inset-0">
          <Image
            src={coverUrl}
            alt=""
            fill
            className="object-cover scale-[1.03] transition-transform duration-[8s] ease-out"
            priority
            sizes="100vw"
            aria-hidden
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20" />
        {/* Subtle colour tint for brand feel */}
        <div className="absolute inset-0 bg-gradient-to-br from-forest/30 via-transparent to-transparent" />

        {/* Status ribbon — sits over the hero */}
        {event.status === "past" && (
          <div className="absolute top-[72px] left-0 right-0 z-10 flex justify-center pointer-events-none">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md border border-cream/15 text-cream/70 text-xs font-medium">
              <History size={11} className="text-cream/50" />
              This session has ended
            </div>
          </div>
        )}
        {event.status === "live" && (
          <div className="absolute top-0 left-0 right-0 z-10 bg-green-600/95 backdrop-blur-sm text-white text-center py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-2">
            <Radio size={12} className="animate-pulse" />
            This session is happening right now — join us
          </div>
        )}
        {event.status === "cancelled" && (
          <div className="absolute top-0 left-0 right-0 z-10 bg-red-700/95 backdrop-blur-sm text-white text-center py-2.5 px-4 text-xs font-semibold">
            This session has been cancelled
          </div>
        )}

        {/* Decorative */}
        <div className="absolute top-24 right-12 w-64 h-64 rounded-full border border-cream/5 hidden lg:block" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, #fdfcf8 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 w-full">
          <FadeIn>
            <div className="max-w-3xl">
              {event.theme_title && (
                <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 border border-gold/30">
                  <span className="label-caps text-xs text-gold/80">Theme</span>
                  <span className="text-xs text-gold font-medium">{event.theme_title}</span>
                </div>
              )}
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-cream leading-tight mb-5">
                {event.title}
              </h1>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-cream/60">
                <div className="flex items-center gap-2">
                  <Calendar size={13} />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={13} />
                  <span>{time}pm</span>
                </div>
                {event.venue_name && (
                  <div className="flex items-center gap-2">
                    <MapPin size={13} />
                    <span>{event.venue_name}</span>
                  </div>
                )}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Body */}
      <section className="py-16 md:py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-10 lg:gap-16">

            {/* Left — info */}
            <div className="lg:col-span-2 space-y-10">

              {/* Description */}
              {event.description && (
                <FadeIn>
                  <p className="text-charcoal/70 leading-relaxed text-base sm:text-lg max-w-2xl">
                    {event.description}
                  </p>
                </FadeIn>
              )}

              {/* Theme block */}
              {event.theme_title && (
                <FadeIn>
                  <div className="rounded-3xl bg-forest p-8 text-cream relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_100%_0%,rgba(201,162,74,0.12),transparent)]" />
                    <div className="relative">
                      <span className="label-caps text-gold/70 text-xs">Tonight&apos;s Theme</span>
                      <h2 className="font-display text-3xl sm:text-4xl font-semibold mt-1 mb-3">
                        {event.theme_title}
                      </h2>
                      {event.theme_scripture && (
                        <div className="flex items-center gap-2 text-cream/50 text-sm mb-4">
                          <BookOpen size={13} />
                          <span>{event.theme_scripture}</span>
                        </div>
                      )}
                      {event.theme_description && (
                        <p className="text-cream/60 text-sm leading-relaxed">{event.theme_description}</p>
                      )}
                    </div>
                  </div>
                </FadeIn>
              )}

              {/* Venue details */}
              {(event.venue_name || event.venue_address) && (
                <FadeIn>
                  <div>
                    <span className="label-caps text-charcoal/50 text-xs">Venue</span>
                    <div className="mt-3 rounded-2xl bg-off-white border border-mist p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-forest/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <MapPin size={14} className="text-forest" />
                        </div>
                        <div>
                          {event.venue_name && (
                            <p className="font-medium text-charcoal text-sm">{event.venue_name}</p>
                          )}
                          {event.venue_address && (
                            <p className="text-charcoal/50 text-sm mt-0.5">{event.venue_address}</p>
                          )}
                          {event.venue_map_url && (
                            <a
                              href={event.venue_map_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-forest mt-2 hover:underline"
                            >
                              Open in Maps <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              )}

              {/* Playlist */}
              {event.playlist_url && (
                <FadeIn>
                  <a
                    href={event.playlist_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-charcoal/60 hover:text-forest transition-colors"
                  >
                    <Music2 size={14} />
                    <span>Listen to the session playlist</span>
                    <ExternalLink size={11} />
                  </a>
                </FadeIn>
              )}
            </div>

            {/* Right — registration card */}
            <div className="lg:col-span-1">
              <FadeIn delay={0.1}>
                <div className="sticky top-28 rounded-3xl border border-mist bg-off-white p-7 shadow-card">
                  {/* Entry type */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-sm font-semibold text-charcoal">Entry</span>
                    <span className="text-lg font-display font-semibold text-forest">
                      {event.type === "free" ? "Free" : `KES ${event.price_kes?.toLocaleString()}`}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <InfoRow icon={<Calendar size={12} />} label={formattedDate} />
                    <InfoRow icon={<Clock size={12} />} label={`${time}pm`} />
                    {event.venue_name && <InfoRow icon={<MapPin size={12} />} label={event.venue_name} />}
                    {event.capacity && (
                      <InfoRow icon={<span className="text-[10px] font-bold">∞</span>} label={`${event.capacity} capacity`} />
                    )}
                  </div>

                  {isOpen ? (
                    <RegistrationModal event={event} />
                  ) : (
                    <div className="w-full py-3.5 rounded-full bg-charcoal/8 text-charcoal/40 text-sm text-center font-medium cursor-not-allowed">
                      {event.status === "past" ? "Session ended" : "Registration closed"}
                    </div>
                  )}

                  {isOpen && (
                    <p className="text-center text-xs text-charcoal/50 mt-3 leading-relaxed">
                      Ticket delivered by email or WhatsApp
                    </p>
                  )}
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function InfoRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-xs text-charcoal/60">
      <span className="text-charcoal/30 flex-shrink-0">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
