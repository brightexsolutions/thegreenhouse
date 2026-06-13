import Link from "next/link";
import { ArrowRight, Heart, Handshake } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";

export function GetInvolvedCta() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #1b3a2a 0%, #2d5240 55%, #1b3a2a 100%)" }}
    >
      {/* Radial gold glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(201,162,74,0.07),transparent)]" />
      <div className="absolute top-8 right-8 w-40 h-40 rounded-full border border-cream/5 hidden lg:block" />
      <div className="absolute bottom-8 left-8 w-24 h-24 rounded-full border border-gold/10 hidden lg:block" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-12">
            <span className="label-caps text-gold/80">Get Involved</span>
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-cream mt-2 leading-tight">
              There&apos;s a place<br />
              <em className="not-italic text-gold">for you here</em>
            </h2>
            <p className="text-cream/55 text-base mt-4 max-w-lg mx-auto leading-relaxed">
              The Green House grows through people who believe in what it is. Whether you give your
              time or your resources, you make the next session possible.
            </p>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
          <FadeIn delay={0.05}>
            <Link
              href="/get-involved?interest=partner#contact"
              className="group relative rounded-3xl border border-cream/10 bg-white/5 hover:bg-white/10 p-8 flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gold group-hover:w-full transition-all duration-500" />
              <div className="w-11 h-11 rounded-2xl bg-gold/15 flex items-center justify-center">
                <Handshake size={20} className="text-gold" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-cream">Partner with us</h3>
                <p className="text-cream/50 text-sm mt-2 leading-relaxed">
                  Serve on the team — vocals, instruments, photography, creative, logistics.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-gold/70 text-sm font-medium mt-auto">
                <span>Get involved</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </FadeIn>

          <FadeIn delay={0.1}>
            <Link
              href="/get-involved?interest=give#contact"
              className="group relative rounded-3xl border border-gold/20 bg-gold/5 hover:bg-gold/10 p-8 flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gold group-hover:w-full transition-all duration-500" />
              <div className="w-11 h-11 rounded-2xl bg-gold/20 flex items-center justify-center">
                <Heart size={20} className="text-gold" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-cream">Support financially</h3>
                <p className="text-cream/50 text-sm mt-2 leading-relaxed">
                  Venue, production, outreach — your contribution covers what makes it all possible.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-gold/70 text-sm font-medium mt-auto">
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
