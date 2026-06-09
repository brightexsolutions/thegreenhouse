import type { Metadata } from "next";
import { FadeIn } from "@/components/motion/fade-in";
import { VisionCards } from "@/components/about/vision-cards";
import { CommunityCircles } from "@/components/home/community-circles";
import { FaqAccordion } from "@/components/about/faq-accordion";
import { SESSION_FREQUENCY } from "@/lib/constants";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: `The Green House is a ${SESSION_FREQUENCY} cross-church gathering in Nairobi. Low pressure. Real connection. Learn about our heart and vision.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[60vh] bg-forest flex items-end overflow-hidden pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_30%_50%,rgba(201,162,74,0.08),transparent)]" />
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
              <p className="text-cream/60 text-base sm:text-lg leading-relaxed max-w-md">
                The Green House exists to create a space where people from different churches
                can encounter God and each other — without performance, pressure, or pretence.
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* What it is / isn&apos;t */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <FadeIn>
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
            </FadeIn>
            <FadeIn delay={0.1}>
              <span className="label-caps text-charcoal/40">What it isn&apos;t</span>
              <ul className="mt-5 space-y-3">
                {[
                  "A replacement for your local church",
                  "A performance platform",
                  "A place to debate theology",
                  "A weekly service",
                  "Exclusive to any denomination",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-charcoal/40">
                    <span className="mt-1 w-4 h-4 rounded-full bg-charcoal/10 flex items-center justify-center shrink-0 line-through" style={{ textDecoration: "none" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-charcoal/20" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </FadeIn>
          </div>
        </div>
      </section>

      <VisionCards />
      <CommunityCircles />
      <FaqAccordion />

      {/* CTA */}
      <section className="py-20 bg-forest text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(201,162,74,0.08),transparent)]" />
        <div className="relative max-w-xl mx-auto px-4">
          <FadeIn>
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-cream mb-4">
              Come find out for yourself
            </h2>
            <p className="text-cream/60 text-sm mb-8">No obligation. Just an evening worth your time.</p>
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
