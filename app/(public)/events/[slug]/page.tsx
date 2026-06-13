import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Calendar, Clock, MapPin, ExternalLink, Music2, BookOpen, History, Radio, Shirt, Users } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { storageUrl, SITE_URL, SITE_NAME } from "@/lib/constants";
import { FadeIn } from "@/components/motion/fade-in";
import { RegistrationModal } from "@/components/events/registration-modal";
import { EventQRCode } from "@/components/events/event-qr-code";
import { EventShareButtons } from "@/components/events/event-share-buttons";
import { PosterViewer }      from "@/components/events/poster-viewer";
import { PastEventCard }     from "@/components/events/past-event-card";
import { GalleryCarousel }   from "@/components/events/gallery-carousel";
import type { Event } from "@/types/database";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

interface EventImageRow { id: string; path: string; caption: string | null; sort_order: number; }

async function getEventWithCount(slug: string): Promise<{ event: Event; registrantCount: number; galleryImages: EventImageRow[] } | null> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .is("deleted_at", null)
      .single();
    if (!data) return null;
    const event = data as Event;

    const [registrantResult, imagesResult] = await Promise.all([
      event.capacity
        ? supabase.from("registrations").select("id", { count: "exact", head: true }).eq("event_id", event.id).is("deleted_at", null)
        : Promise.resolve({ count: 0 }),
      supabase.from("event_images").select("id, path, caption, sort_order").eq("event_id", event.id).order("sort_order"),
    ]);

    const registrantCount = (registrantResult as { count: number | null }).count ?? 0;
    const galleryImages   = ((imagesResult as { data: EventImageRow[] | null }).data ?? []) as EventImageRow[];

    return { event, registrantCount, galleryImages };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getEventWithCount(slug);
  const event = result?.event;
  if (!event) return {};

  const ogImage = event.banner_image
    ? storageUrl(`event-images/${event.banner_image}`, { width: 1200 })
    : event.cover_image
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
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, alt: event.title }] } : {}),
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

function getYouTubeEmbedUrl(url: string): string | null {
  const watchMatch = url.match(/youtube\.com\/watch\?(?:.*&)?v=([A-Za-z0-9_-]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}?rel=0`;
  const shortMatch = url.match(/youtu\.be\/([A-Za-z0-9_-]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?rel=0`;
  return null;
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
    ...(event.banner_image
      ? { image: storageUrl(`event-images/${event.banner_image}`, { width: 1200 }) }
      : event.cover_image
      ? { image: storageUrl(`event-images/${event.cover_image}`, { width: 1200 }) }
      : {}),
  };
  return JSON.stringify(base);
}

// African-context fallback banners (used only when no banner_image is uploaded)
const BANNER_FALLBACKS = [
  "https://images.unsplash.com/photo-1594608661623-aa0bd3a69d98?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&w=1600&q=80",
];
function pickBannerFallback(slug: string) {
  const hash = slug.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return BANNER_FALLBACKS[hash % BANNER_FALLBACKS.length];
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const result = await getEventWithCount(slug);
  if (!result) notFound();
  const { event, registrantCount, galleryImages } = result;

  // Banner = hero background. Poster (cover_image) shown in details, never as hero bg.
  const bannerUrl = event.banner_image
    ? storageUrl(`event-images/${event.banner_image}`, { width: 1600, quality: 85 })
    : pickBannerFallback(event.slug);

  function resolveMedia(path: string | null | undefined): string | null {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return storageUrl(`event-images/${path}`);
  }

  const posterThumbUrl = event.cover_image
    ? (event.cover_image.startsWith("http")
        ? event.cover_image
        : storageUrl(`event-images/${event.cover_image}`, { width: 400, quality: 85 }))
    : null;

  const posterFullUrl = event.cover_image
    ? resolveMedia(event.cover_image)
    : null;

  const posterUrl = posterThumbUrl;

  const videoUrl = resolveMedia(event.highlight_video);

  const formattedDate = new Date(event.event_date).toLocaleDateString("en-KE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const time = event.event_time.slice(0, 5).replace(":", ".");

  const isOpen   = event.status === "published" || event.status === "live";
  const isPast   = event.status === "past";
  const isFull   = !!(event.capacity && registrantCount >= event.capacity);
  const eventUrl = `${SITE_URL}/events/${event.slug}`;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(event) }} />

      {/* Hero — banner image only */}
      <section className="relative min-h-[70vh] flex items-end overflow-hidden pt-20">
        <div className="absolute inset-0">
          <Image
            src={bannerUrl}
            alt=""
            fill
            className="object-cover scale-[1.03] transition-transform duration-[8s] ease-out"
            priority
            sizes="100vw"
            aria-hidden
            unoptimized
          />
        </div>
        {/* Deep overlay for text readability regardless of image brightness */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-br from-forest/35 via-transparent to-transparent" />

        {/* Status ribbons */}
        {isPast && (
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

        <div className="absolute top-24 right-12 w-64 h-64 rounded-full border border-cream/5 hidden lg:block" />
        <div className="absolute inset-0 opacity-[0.03]"
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

              {event.description && (
                <FadeIn>
                  <p className="text-charcoal/70 leading-relaxed text-base sm:text-lg max-w-2xl">
                    {event.description}
                  </p>
                </FadeIn>
              )}

              {/* Theme block — poster lives inside on the right */}
              {event.theme_title && (
                <FadeIn>
                  <div className="rounded-3xl bg-forest p-8 text-cream relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_100%_0%,rgba(201,162,74,0.12),transparent)]" />
                    <div className="relative flex items-start gap-6">
                      <div className="flex-1 min-w-0">
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
                      {posterUrl && (
                        <PosterViewer
                          src={posterUrl}
                          fullSrc={posterFullUrl ?? posterUrl}
                          title={event.title}
                          thumbnailClassName="relative w-20 flex-shrink-0 rounded-xl overflow-hidden shadow-lg border border-cream/15 hover:border-cream/30 hover:scale-[1.02] transition-all duration-200"
                        />
                      )}
                    </div>
                  </div>
                </FadeIn>
              )}

              {/* Highlight video — YouTube embed or direct file */}
              {videoUrl && (() => {
                const ytEmbed = getYouTubeEmbedUrl(videoUrl);
                return (
                  <FadeIn>
                    {ytEmbed ? (
                      <div className="rounded-3xl overflow-hidden border border-mist shadow-lg aspect-video">
                        <iframe
                          src={ytEmbed}
                          title="Highlight video"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="rounded-3xl overflow-hidden border border-mist bg-black shadow-lg">
                        <video
                          src={videoUrl}
                          autoPlay
                          muted
                          playsInline
                          controls
                          loop
                          className="w-full"
                        />
                      </div>
                    )}
                  </FadeIn>
                );
              })()}

              {/* Poster shown standalone only when there is no theme block to host it */}
              {posterUrl && !event.theme_title && (
                <FadeIn>
                  <div className="flex items-center gap-4">
                    <PosterViewer src={posterUrl} fullSrc={posterFullUrl ?? posterUrl} title={event.title} />
                    <div>
                      <p className="text-sm font-medium text-charcoal">Event Poster</p>
                      <p className="text-xs text-charcoal/40 mt-0.5">Tap to view</p>
                    </div>
                  </div>
                </FadeIn>
              )}

              {/* Dress code — not relevant on past events */}
              {event.dress_code && !isPast && (
                <FadeIn>
                  <div className="rounded-2xl bg-gold/8 border border-gold/20 p-5 flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-gold/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Shirt size={15} className="text-gold" />
                    </div>
                    <div>
                      <span className="label-caps text-gold/80 text-xs">Dress Code</span>
                      <p className="text-sm text-charcoal/80 mt-1 leading-relaxed">{event.dress_code}</p>
                    </div>
                  </div>
                </FadeIn>
              )}

              {/* Venue — only in left column for upcoming events; past events show it in sidebar */}
              {!isPast && (event.venue_name || event.venue_address) && (
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

            {/* Right — registration card OR past session card + venue */}
            <div className="lg:col-span-1">
              <FadeIn delay={0.1}>
                {isPast ? (
                  <div className="space-y-4">
                    <PastEventCard event={event} />
                    {(event.venue_name || event.venue_address) && (
                      <div className="rounded-2xl bg-off-white border border-mist p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg bg-forest/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <MapPin size={13} className="text-forest" />
                          </div>
                          <div>
                            {event.venue_name && (
                              <p className="font-medium text-charcoal text-sm">{event.venue_name}</p>
                            )}
                            {event.venue_address && (
                              <p className="text-charcoal/50 text-xs mt-0.5">{event.venue_address}</p>
                            )}
                            {event.venue_map_url && (
                              <a href={event.venue_map_url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-forest mt-1.5 hover:underline">
                                Open in Maps <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="sticky top-28 rounded-3xl border border-mist bg-off-white p-7 shadow-card">
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
                      {event.dress_code && <InfoRow icon={<Shirt size={12} />} label={event.dress_code} />}
                      {event.capacity && (
                        <InfoRow
                          icon={<Users size={12} />}
                          label={isFull
                            ? `${event.capacity} — session full`
                            : `${registrantCount} / ${event.capacity} registered`
                          }
                        />
                      )}
                    </div>

                    {isOpen && isFull ? (
                      <div className="w-full py-3.5 rounded-full bg-red-50 border border-red-100 text-red-500 text-sm text-center font-medium">
                        This session is full
                      </div>
                    ) : isOpen ? (
                      <RegistrationModal event={event} />
                    ) : (
                      <div className="w-full py-3.5 rounded-full bg-charcoal/8 text-charcoal/40 text-sm text-center font-medium cursor-not-allowed">
                        Registration closed
                      </div>
                    )}

                    {isOpen && !isFull && (
                      <p className="text-center text-xs text-charcoal/50 mt-3 leading-relaxed">
                        Ticket sent to your email — link can also be copied &amp; shared
                      </p>
                    )}

                    {isOpen && !isFull && (
                      <div className="mt-5 space-y-4">
                        <EventQRCode slug={event.slug} />
                        <div className="pt-2 border-t border-mist">
                          <p className="text-xs text-charcoal/40 mb-2 text-center">Share this session</p>
                          <EventShareButtons url={eventUrl} title={event.title} date={formattedDate} variant="card" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </FadeIn>
            </div>

          </div>
        </div>
      </section>

      {/* Event photos — auto-scrolling carousel */}
      {galleryImages.length > 0 && (
        <section className="py-16 md:py-20 bg-charcoal">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <div className="flex items-end justify-between mb-8">
                <div>
                  <span className="label-caps text-cream/35 text-xs">From the session</span>
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold text-cream mt-1">{event.title}</h2>
                </div>
                <Link
                  href="/gallery"
                  className="inline-flex items-center gap-1.5 text-xs text-cream/50 hover:text-cream font-medium transition-colors"
                >
                  View full gallery <ArrowRight size={11} />
                </Link>
              </div>
            </FadeIn>

            <GalleryCarousel
              eventTitle={event.title}
              images={galleryImages.map(img => ({
                id:      img.id,
                src:     storageUrl(`event-images/${img.path}`, { width: 600, quality: 80 }),
                fullSrc: storageUrl(`event-images/${img.path}`),
                alt:     img.caption ?? `${event.title} photo`,
              }))}
            />
          </div>
        </section>
      )}
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
