import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FadeIn } from "@/components/motion/fade-in";
import { VisionCards } from "@/components/about/vision-cards";
import { FaqAccordion } from "@/components/about/faq-accordion";
import { SESSION_FREQUENCY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About",
  description: `The Green House is a ${SESSION_FREQUENCY} cross-church gathering in Nairobi. Low pressure. Real connection. Learn about our heart and vision.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      {/* Hero — full-bleed photo with dark overlay */}
      <section className="relative min-h-[70vh] flex items-end overflow-hidden pt-20">
        {/* Background photo */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=75"
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/85 to-forest/50" />
        </div>

        {/* Decorative rings */}
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full border border-cream/5 hidden lg:block" />
        <div className="absolute bottom-10 left-10 w-32 h-32 rounded-full border border-gold/10 hidden lg:block" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-10 w-full">
          <div className="grid lg:grid-cols-2 gap-10 items-end">
            <FadeIn>
              <span className="label-caps text-gold/80">About</span>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold text-cream mt-2 leading-[0.95]">
                Not a service.
                <br />
                <em className="not-italic text-gold">A gathering.</em>
              </h1>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p className="text-cream/70 text-base sm:text-lg leading-relaxed max-w-md">
                The Green House exists to create a space where people from different churches
                can encounter God and each other — without performance, pressure, or pretence.
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* What it is / isn't — with a side photo */}
      <section className="py-20 md:py-28 bg-cream overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn direction="left">
              <div className="space-y-10">
                <div>
                  <span className="label-caps text-gold">What it is</span>
                  <ul className="mt-5 space-y-3">
                    {[
                      "A space to exhale spiritually",
                      "Cross-church and non-denominational",
                      "Led by rotating worship teams",
                      "~60 minutes of worship, prayer and sharing",
                      "Open to everyone — believer or curious",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-charcoal/70">
                        <span className="mt-1 w-4 h-4 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="label-caps text-charcoal/40">What it isn&apos;t</span>
                  <ul className="mt-5 space-y-3">
                    {[
                      "A replacement for your local church",
                      "A performance platform",
                      "A place to debate theology",
                      "A weekly service",
                      "Exclusive to any denomination",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-charcoal/35">
                        <span className="mt-1 w-4 h-4 rounded-full bg-charcoal/8 flex items-center justify-center shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-charcoal/20" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </FadeIn>

            {/* Right — stacked photos */}
            <FadeIn delay={0.15} direction="right">
              <div className="relative h-[420px] sm:h-[480px]">
                {/* Main photo */}
                <div className="absolute inset-0 rounded-[2rem] overflow-hidden shadow-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&w=800&q=80"
                    alt="Community gathering"
                    fill
                    className="object-cover"
                    sizes="(max-width:1024px) 90vw, 44vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest/40 to-transparent" />
                </div>
                {/* Accent card bottom-left */}
                <div className="absolute -bottom-5 -left-5 w-[45%] h-[38%] rounded-[1.5rem] overflow-hidden shadow-xl border-4 border-cream">
                  <Image
                    src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=400&q=80"
                    alt="People connecting"
                    fill
                    className="object-cover"
                    sizes="(max-width:1024px) 40vw, 20vw"
                  />
                </div>
                {/* Gold ring */}
                <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full border-2 border-gold/30 pointer-events-none" />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <VisionCards />

      {/* FAQ */}
      <FaqAccordion />

      {/* CTA — photo background */}
      <section className="relative py-24 text-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1400&q=70"
            alt=""
            fill
            className="object-cover opacity-25"
            sizes="100vw"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-b from-forest via-forest/95 to-forest" />
        </div>
        <div className="relative max-w-xl mx-auto px-4">
          <FadeIn>
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-cream mb-4">
              Come find out for yourself
            </h2>
            <p className="text-cream/60 text-base mb-8">No obligation. Just an evening worth your time.</p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gold text-forest font-semibold text-sm hover:bg-gold-light transition-all duration-200"
            >
              See upcoming sessions
            </Link>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
