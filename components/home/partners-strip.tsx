import Link from "next/link";
import { ArrowRight, Code2, Terminal, Cpu, Braces, Cake, UtensilsCrossed, Cookie, ExternalLink } from "lucide-react";
import { PARTNERS, SITE_NAME } from "@/lib/constants";
import { FadeIn } from "@/components/motion/fade-in";
import { createAdminClient } from "@/lib/supabase/server";

const PALETTES = [
  {
    // Deep forest — Brightex / tech
    gradient:  "from-[#0a1f12] via-[#1b3a2a] to-[#0d2318]",
    glow:      "rgba(46,90,62,0.70)",
    pattern:   `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22'%3E%3Ccircle cx='11' cy='11' r='1' fill='rgba(255,255,255,0.12)'/%3E%3C/svg%3E")`,
    textColor: "text-cream",
    roleColor: "bg-cream/10 text-cream border-cream/35",
  },
  {
    // Warm bark / amber — Glace / food
    gradient:  "from-[#2a1605] via-[#4a2810] to-[#1e0f03]",
    glow:      "rgba(201,162,74,0.40)",
    pattern:   `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Cpath d='M0 20L20 0M-4 4L4-4M16 24L24 16' stroke='rgba(255,255,255,0.08)' stroke-width='1'/%3E%3C/svg%3E")`,
    textColor: "text-gold-pale",
    roleColor: "bg-cream/10 text-cream border-cream/35",
  },
  {
    // Slate charcoal
    gradient:  "from-[#111210] via-[#1e1f1c] to-[#0c0d0b]",
    glow:      "rgba(100,100,90,0.45)",
    pattern:   `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cpath d='M12 7v10M7 12h10' stroke='rgba(255,255,255,0.09)' stroke-width='1'/%3E%3C/svg%3E")`,
    textColor: "text-cream",
    roleColor: "bg-cream/8 text-cream/60 border-cream/10",
  },
  {
    // Sage / moss
    gradient:  "from-[#1a2e1f] via-[#2d5240] to-[#111e15]",
    glow:      "rgba(125,168,130,0.35)",
    pattern:   `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Ccircle cx='14' cy='14' r='1.2' fill='rgba(255,255,255,0.10)'/%3E%3Ccircle cx='0' cy='0' r='1.2' fill='rgba(255,255,255,0.10)'/%3E%3Ccircle cx='28' cy='0' r='1.2' fill='rgba(255,255,255,0.10)'/%3E%3Ccircle cx='0' cy='28' r='1.2' fill='rgba(255,255,255,0.10)'/%3E%3Ccircle cx='28' cy='28' r='1.2' fill='rgba(255,255,255,0.10)'/%3E%3C/svg%3E")`,
    textColor: "text-cream",
    roleColor: "bg-sage/15 text-sage-light/80 border-sage/20",
  },
] as const;

/** Thematic icon decorations per partner slot — faint watermark layer */
function CardDecoration({ index }: { index: number }) {
  if (index === 0) {
    // Brightex — tech / code
    return (
      <>
        {/* Large code brackets — top right */}
        <div className="absolute top-4 right-4 text-white/[0.07] pointer-events-none">
          <Code2 size={58} strokeWidth={1} />
        </div>
        {/* Terminal — bottom left */}
        <div className="absolute bottom-4 left-4 text-white/[0.05] pointer-events-none">
          <Terminal size={34} strokeWidth={1} />
        </div>
        {/* CPU chip — top left, smallest */}
        <div className="absolute top-5 left-5 text-white/[0.04] pointer-events-none">
          <Cpu size={22} strokeWidth={1} />
        </div>
        {/* Braces — bottom right hint */}
        <div className="absolute bottom-5 right-5 text-white/[0.04] pointer-events-none">
          <Braces size={18} strokeWidth={1} />
        </div>
      </>
    );
  }

  if (index === 1) {
    // Glace — cake & confectionery
    return (
      <>
        {/* Cake — top right, largest */}
        <div className="absolute top-3 right-4 text-white/[0.09] pointer-events-none">
          <Cake size={54} strokeWidth={1} />
        </div>
        {/* Utensils crossed — bottom left */}
        <div className="absolute bottom-4 left-4 text-white/[0.07] pointer-events-none">
          <UtensilsCrossed size={32} strokeWidth={1} />
        </div>
        {/* Cookie — top left, small */}
        <div className="absolute top-5 left-5 text-white/[0.05] pointer-events-none">
          <Cookie size={20} strokeWidth={1} />
        </div>
        {/* Second cookie — bottom right hint */}
        <div className="absolute bottom-5 right-5 text-white/[0.04] pointer-events-none">
          <Cookie size={16} strokeWidth={1} />
        </div>
      </>
    );
  }

  return null;
}

async function getSiteName(): Promise<string> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "site_name")
      .single();
    return data?.value || SITE_NAME;
  } catch {
    return SITE_NAME;
  }
}

export async function PartnersStrip() {
  if (!PARTNERS.length) return null;

  const siteName = await getSiteName();

  return (
    <section className="py-14 md:py-16 bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section label */}
        <FadeIn>
          <div className="flex items-center gap-4 mb-10">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/25" />
            <span className="text-[10px] uppercase tracking-[0.22em] text-charcoal/40 font-semibold">
              Partners &amp; Supporters
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/25" />
          </div>
        </FadeIn>

        {/* Cards */}
        <div className={`grid gap-4 sm:gap-5 ${
          PARTNERS.length <= 2
            ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
            : PARTNERS.length === 3
            ? "grid-cols-1 sm:grid-cols-3"
            : "grid-cols-2 lg:grid-cols-4"
        }`}>
          {PARTNERS.map((partner, i) => {
            const palette = PALETTES[i % PALETTES.length];
            return (
              <FadeIn key={partner.name} delay={i * 0.1}>
                <div
                  className={`group relative rounded-3xl overflow-hidden flex flex-col items-center justify-center min-h-[180px] sm:min-h-[200px] px-6 py-7 text-center transition-all duration-300
                    ${partner.url ? "cursor-pointer hover:-translate-y-1 hover:shadow-2xl" : ""}
                  `}
                >
                  {/* Gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${palette.gradient}`} />

                  {/* Pattern overlay */}
                  <div
                    className="absolute inset-0 opacity-100"
                    style={{ backgroundImage: palette.pattern, backgroundSize: "22px 22px" }}
                  />

                  {/* Thematic icon decorations */}
                  <CardDecoration index={i} />

                  {/* Ambient radial glow — bottom centre */}
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-2/3 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse at 50% 100%, ${palette.glow} 0%, transparent 70%)` }}
                  />

                  {/* Top fade for depth */}
                  <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/20 to-transparent" />

                  {/* External link badge — always visible when card has URL */}
                  {partner.url && (
                    <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm transition-all duration-200 group-hover:bg-white/18 group-hover:border-white/25">
                      <ExternalLink size={9} className="text-white/70 group-hover:text-white/90 transition-colors" />
                      <span className="text-[9px] font-semibold text-white/60 group-hover:text-white/85 transition-colors uppercase tracking-wide">Visit</span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center gap-4">
                    {partner.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={partner.logoUrl}
                        alt={partner.name}
                        className="max-h-20 max-w-[80%] object-contain drop-shadow-lg"
                      />
                    ) : (
                      <p className={`font-display font-bold leading-none tracking-tight ${palette.textColor}
                        ${partner.name.length > 12 ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl"}
                      `}>
                        {partner.name}
                      </p>
                    )}

                    {/* Role badge */}
                    <span className={`inline-flex items-center px-3 py-1 rounded-full border text-[9px] uppercase tracking-[0.18em] font-semibold ${palette.roleColor}`}>
                      {partner.role}
                    </span>
                  </div>

                  {/* Hover: border glow */}
                  <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/5 group-hover:ring-white/18 transition-all duration-300" />

                  {/* Clickable overlay */}
                  {partner.url && (
                    <Link
                      href={partner.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 z-20"
                      aria-label={`Visit ${partner.name}`}
                    />
                  )}
                </div>
              </FadeIn>
            );
          })}
        </div>

        {/* Partner CTA */}
        <FadeIn delay={0.25}>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
            <p className="text-sm text-charcoal/55 font-medium">
              Want to partner with {siteName}?
            </p>
            <Link
              href="/get-involved?interest=partner"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest text-cream text-sm font-semibold hover:bg-moss transition-colors shadow-sm"
            >
              Get in touch
              <ArrowRight size={13} />
            </Link>
          </div>
        </FadeIn>

      </div>
    </section>
  );
}
