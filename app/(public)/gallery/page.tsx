import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { FadeIn, FadeInStagger, StaggerChild } from "@/components/motion/fade-in";
import { storageUrl } from "@/lib/constants";
import { ArrowUpRight } from "lucide-react";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Gallery",
  description: "Moments from The Green House — a visual record of our gatherings across Nairobi.",
  alternates: { canonical: "/gallery" },
};

interface GalleryImage {
  id: string;
  path: string;
  caption: string | null;
  event_id: string;
  events: { title: string; slug: string; event_date: string } | null;
}

async function getGalleryImages(): Promise<GalleryImage[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("event_images")
      .select("id, path, caption, event_id, events(title, slug, event_date)")
      .order("created_at", { ascending: false })
      .limit(40);
    return (data as unknown as GalleryImage[]) ?? [];
  } catch {
    return [];
  }
}

const SIZE_CYCLE = [
  "aspect-[4/5]",
  "aspect-[3/4]",
  "aspect-square",
  "aspect-[4/5]",
  "aspect-[3/2]",
  "aspect-[3/4]",
];

// Placeholder images shown in the empty state so the page never looks bare
const PLACEHOLDER_PHOTOS = [
  { src: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=75", aspect: "aspect-[4/5]" },
  { src: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=75", aspect: "aspect-[3/4]" },
  { src: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=600&q=75", aspect: "aspect-square" },
  { src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=75", aspect: "aspect-[4/5]" },
  { src: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=75", aspect: "aspect-[3/2]" },
  { src: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=600&q=75", aspect: "aspect-[3/4]" },
];

export default async function GalleryPage() {
  const images = await getGalleryImages();
  const isEmpty = images.length === 0;

  return (
    <>
      {/* Hero — photo background */}
      <section className="relative min-h-[55vh] flex items-end overflow-hidden pt-20">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&w=1600&q=75"
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
            aria-hidden
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/85 to-forest/50" />
        </div>
        <div className="absolute top-20 right-24 w-56 h-56 rounded-full border border-cream/5 hidden lg:block" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
          <FadeIn>
            <span className="label-caps text-gold/80">Gallery</span>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold text-cream mt-2 leading-[0.95]">
              Moments worth
              <br />
              <em className="not-italic text-gold">keeping.</em>
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-5 text-cream/70 max-w-md text-base leading-relaxed">
              A visual record of our gatherings. Each session leaves something behind.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Gallery grid */}
      <section className="py-16 md:py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {isEmpty ? (
            /* Empty state — placeholder grid with coming-soon overlay */
            <div className="relative">
              {/* Blurred placeholder grid */}
              <div className="columns-2 sm:columns-3 gap-3 pointer-events-none select-none">
                {PLACEHOLDER_PHOTOS.map((p, i) => (
                  <div key={i} className={`relative overflow-hidden rounded-2xl mb-3 break-inside-avoid ${p.aspect}`}>
                    <Image
                      src={p.src}
                      alt=""
                      fill
                      className="object-cover blur-[2px] brightness-75"
                      sizes="(max-width:640px) 50vw, 33vw"
                      aria-hidden
                      unoptimized
                    />
                  </div>
                ))}
              </div>

              {/* Overlay message */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-cream/70 backdrop-blur-[1px] rounded-2xl">
                <FadeIn>
                  <div className="text-center px-6 py-12">
                    <div className="w-20 h-20 rounded-full bg-forest/10 border border-forest/15 flex items-center justify-center mx-auto mb-6">
                      <span className="text-3xl">📷</span>
                    </div>
                    <h3 className="font-display text-3xl font-semibold text-forest mb-3">
                      Photos coming after Session 02
                    </h3>
                    <p className="text-charcoal/60 text-base max-w-xs mx-auto leading-relaxed">
                      Every gathering gets documented. Check back after June 26.
                    </p>
                    <Link
                      href="/events"
                      className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-full bg-forest text-cream font-semibold text-sm hover:bg-moss transition-all"
                    >
                      Register for Session 02
                    </Link>
                  </div>
                </FadeIn>
              </div>
            </div>
          ) : (
            <FadeInStagger className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-0" staggerDelay={0.03}>
              {images.map((img, i) => {
                const url = storageUrl(`event-images/${img.path}`, { width: 800, quality: 80 });
                return (
                  <StaggerChild key={img.id}>
                    <div className={`group relative overflow-hidden rounded-2xl mb-3 break-inside-avoid ${SIZE_CYCLE[i % SIZE_CYCLE.length]}`}>
                      <Image
                        src={url}
                        alt={img.caption ?? "Gallery photo"}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />

                      {(img.caption || img.events) && (
                        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <div className="bg-black/70 backdrop-blur-sm rounded-xl px-3 py-2">
                            {img.caption && <p className="text-cream text-sm">{img.caption}</p>}
                            {img.events && (
                              <Link
                                href={`/events/${img.events.slug}`}
                                className="text-gold/80 text-xs flex items-center gap-1 mt-0.5 hover:text-gold"
                              >
                                {img.events.title} <ArrowUpRight size={10} />
                              </Link>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </StaggerChild>
                );
              })}
            </FadeInStagger>
          )}
        </div>
      </section>

      {/* CTA — photo background */}
      {!isEmpty && (
        <section className="relative py-16 text-center overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=70"
              alt=""
              fill
              className="object-cover opacity-20"
              sizes="100vw"
              aria-hidden
              unoptimized
            />
            <div className="absolute inset-0 bg-forest" style={{ opacity: 0.88 }} />
          </div>
          <div className="relative max-w-xl mx-auto px-4">
            <FadeIn>
              <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream mb-4">
                Be in the next one
              </h2>
              <p className="text-cream/60 text-base mb-7">Register for an upcoming session and become part of the story.</p>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gold text-forest font-semibold text-sm hover:bg-gold-light transition-all"
              >
                View upcoming sessions
              </Link>
            </FadeIn>
          </div>
        </section>
      )}
    </>
  );
}
