import type { Metadata } from "next";
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

// Deterministic variety in image sizing for a masonry-like feel
const SIZE_CYCLE = [
  "aspect-[4/5]",
  "aspect-[3/4]",
  "aspect-square",
  "aspect-[4/5]",
  "aspect-[3/2]",
  "aspect-[3/4]",
];

export default async function GalleryPage() {
  const images = await getGalleryImages();

  return (
    <>
      {/* Hero */}
      <section className="relative bg-forest pt-32 pb-14 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_20%_60%,rgba(201,162,74,0.07),transparent)]" />
        <div className="absolute top-20 right-24 w-56 h-56 rounded-full border border-cream/5 hidden lg:block" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <span className="label-caps text-gold/80">Gallery</span>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold text-cream mt-2 leading-[0.95]">
              Moments worth
              <br />
              <em className="not-italic text-gold">keeping.</em>
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-5 text-cream/50 max-w-md text-base leading-relaxed">
              A visual record of our gatherings. Each session leaves something behind.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Gallery grid */}
      <section className="py-16 md:py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {images.length === 0 ? (
            <FadeIn>
              <div className="text-center py-24">
                <p className="text-4xl mb-4">🌿</p>
                <h3 className="font-display text-2xl font-semibold text-forest mb-2">Gallery coming soon</h3>
                <p className="text-charcoal/40 text-sm max-w-xs mx-auto">Photos from our sessions will appear here after each gathering.</p>
              </div>
            </FadeIn>
          ) : (
            <FadeInStagger className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-0" staggerDelay={0.03}>
              {images.map((img, i) => {
                const url = storageUrl(`event-images/${img.path}`, { width: 800, quality: 80 });
                return (
                  <StaggerChild key={img.id}>
                    <div className={`group relative overflow-hidden rounded-2xl mb-3 break-inside-avoid ${SIZE_CYCLE[i % SIZE_CYCLE.length]}`}>
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: `url(${url})` }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />

                      {/* Caption overlay */}
                      {(img.caption || img.events) && (
                        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <div className="bg-black/70 backdrop-blur-sm rounded-xl px-3 py-2">
                            {img.caption && <p className="text-cream text-[10px]">{img.caption}</p>}
                            {img.events && (
                              <Link
                                href={`/events/${img.events.slug}`}
                                className="text-gold/80 text-[9px] flex items-center gap-1 mt-0.5 hover:text-gold"
                              >
                                {img.events.title} <ArrowUpRight size={8} />
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

      {/* CTA */}
      <section className="py-16 bg-forest text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(201,162,74,0.08),transparent)]" />
        <div className="relative max-w-xl mx-auto px-4">
          <FadeIn>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream mb-4">
              Be in the next one
            </h2>
            <p className="text-cream/50 text-sm mb-7">Register for an upcoming session and become part of the story.</p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gold text-forest font-semibold text-sm hover:bg-gold-light transition-all"
            >
              View upcoming sessions
            </Link>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
