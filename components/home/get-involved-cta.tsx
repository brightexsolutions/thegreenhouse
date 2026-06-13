import Link from "next/link";
import { ArrowRight, Heart, Handshake } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";

export function GetInvolvedCta() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden bg-cream">
      {/* Subtle texture rings */}
      <div className="absolute top-0 right-0 w-[480px] h-[480px] rounded-full border border-forest/5 translate-x-1/2 -translate-y-1/3 hidden lg:block" />
      <div className="absolute bottom-0 left-0 w-[320px] h-[320px] rounded-full border border-gold/10 -translate-x-1/3 translate-y-1/3 hidden lg:block" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(201,162,74,0.05),transparent)]" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-12">
            <span className="label-caps text-forest/60 text-xs">Get Involved</span>
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-charcoal mt-2 leading-tight">
              There&apos;s a place<br />
              <em className="not-italic text-forest">for you here</em>
            </h2>
            <p className="text-charcoal/50 text-base mt-4 max-w-lg mx-auto leading-relaxed">
              The Green House grows through people who believe in what it is. Whether you give your
              time or your resources, you make the next session possible.
            </p>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
          <FadeIn delay={0.05}>
            <Link
              href="/get-involved?interest=partner#contact"
              className="group relative rounded-3xl border border-forest/15 bg-white hover:border-forest/30 hover:shadow-lg p-7 flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1 overflow-hidden shadow-sm"
            >
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-forest group-hover:w-full transition-all duration-500" />
              <div className="w-11 h-11 rounded-2xl bg-forest/8 flex items-center justify-center">
                <Handshake size={20} className="text-forest" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-charcoal">Partner with us</h3>
                <p className="text-charcoal/50 text-sm mt-2 leading-relaxed">
                  Serve on the team — vocals, instruments, photography, creative, logistics.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-forest text-sm font-medium mt-auto">
                <span>Get involved</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </FadeIn>

          <FadeIn delay={0.1}>
            <Link
              href="/get-involved?interest=give#contact"
              className="group relative rounded-3xl border border-gold/25 bg-gold-pale/40 hover:border-gold/50 hover:shadow-lg p-7 flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1 overflow-hidden shadow-sm"
            >
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gold group-hover:w-full transition-all duration-500" />
              <div className="w-11 h-11 rounded-2xl bg-gold/15 flex items-center justify-center">
                <Heart size={20} className="text-gold" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-charcoal">Support financially</h3>
                <p className="text-charcoal/50 text-sm mt-2 leading-relaxed">
                  Venue, production, outreach — your contribution covers what makes it all possible.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-bark text-sm font-medium mt-auto">
                <span>Give now</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
