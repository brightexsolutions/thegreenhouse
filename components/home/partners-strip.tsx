import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { PARTNERS } from "@/lib/constants";
import { FadeIn } from "@/components/motion/fade-in";

export function PartnersStrip() {
  if (!PARTNERS.length) return null;

  return (
    <section className="py-14 md:py-16 bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          {/* Section label */}
          <div className="flex items-center gap-4 mb-10">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/25" />
            <span className="text-[10px] uppercase tracking-[0.22em] text-charcoal/40 font-semibold">
              Partners &amp; Supporters
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/25" />
          </div>
        </FadeIn>

        {/* Partner cards */}
        <div className={`grid gap-4 sm:gap-5 ${
          PARTNERS.length <= 2
            ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
            : PARTNERS.length === 3
            ? "grid-cols-1 sm:grid-cols-3"
            : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        }`}>
          {PARTNERS.map((partner, i) => (
            <FadeIn key={partner.name} delay={i * 0.08}>
              <div className="group relative rounded-2xl border border-mist bg-off-white hover:border-gold/30 hover:bg-white transition-all duration-300 p-5 flex flex-col gap-2.5 h-full">
                {/* Gold left accent line */}
                <span className="absolute left-0 top-4 bottom-4 w-[2px] rounded-full bg-gradient-to-b from-transparent via-gold/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div>
                  <p className="font-display font-semibold text-charcoal text-[15px] leading-tight">
                    {partner.name}
                  </p>
                  <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full bg-forest/8 text-[9px] uppercase tracking-[0.16em] text-forest/70 font-semibold">
                    {partner.role}
                  </span>
                </div>

                {partner.description && (
                  <p className="text-[12px] text-charcoal/45 leading-relaxed flex-1">
                    {partner.description}
                  </p>
                )}

                {partner.url && (
                  <Link
                    href={partner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-forest/50 hover:text-forest transition-colors mt-auto"
                  >
                    Visit <ExternalLink size={9} />
                  </Link>
                )}
              </div>
            </FadeIn>
          ))}

          {/* "More joining" placeholder card */}
          <FadeIn delay={PARTNERS.length * 0.08}>
            <div className="rounded-2xl border border-dashed border-charcoal/12 bg-transparent flex flex-col items-center justify-center gap-2 p-5 min-h-[100px] text-center">
              <span className="w-7 h-7 rounded-full border border-dashed border-charcoal/20 flex items-center justify-center">
                <Plus size={12} className="text-charcoal/25" />
              </span>
              <p className="text-[10px] text-charcoal/30 leading-snug">
                More partners<br />joining soon
              </p>
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={0.3}>
          <p className="text-center text-[10px] text-charcoal/25 mt-8 italic">
            Interested in partnering with The Green House?{" "}
            <a href="mailto:thegreenhouse.contact01@gmail.com" className="underline underline-offset-2 hover:text-charcoal/50 transition-colors">
              Get in touch
            </a>
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
