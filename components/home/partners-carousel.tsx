"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, ExternalLink,
  Code2, Terminal, Cpu, Braces,
  Cake, UtensilsCrossed, Cookie,
  Brain, Heart, Smile,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Partner {
  name:        string;
  role:        string;
  description: string | null;
  logoUrl:     string | null;
  url:         string | null;
}

// ─── Palettes ─────────────────────────────────────────────────────────────────

const PALETTES = [
  {
    gradient:  "from-[#0a1f12] via-[#1b3a2a] to-[#0d2318]",
    glow:      "rgba(46,90,62,0.70)",
    pattern:   `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22'%3E%3Ccircle cx='11' cy='11' r='1' fill='rgba(255,255,255,0.12)'/%3E%3C/svg%3E")`,
    textColor: "text-cream",
    roleColor: "bg-cream/10 text-cream border-cream/35",
  },
  {
    gradient:  "from-[#2a1605] via-[#4a2810] to-[#1e0f03]",
    glow:      "rgba(201,162,74,0.40)",
    pattern:   `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Cpath d='M0 20L20 0M-4 4L4-4M16 24L24 16' stroke='rgba(255,255,255,0.08)' stroke-width='1'/%3E%3C/svg%3E")`,
    textColor: "text-gold-pale",
    roleColor: "bg-cream/10 text-cream border-cream/35",
  },
  {
    gradient:  "from-[#111210] via-[#1e1f1c] to-[#0c0d0b]",
    glow:      "rgba(100,100,90,0.45)",
    pattern:   `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cpath d='M12 7v10M7 12h10' stroke='rgba(255,255,255,0.09)' stroke-width='1'/%3E%3C/svg%3E")`,
    textColor: "text-cream",
    roleColor: "bg-cream/15 text-cream/90 border-cream/30",
  },
  {
    gradient:  "from-[#1a2e1f] via-[#2d5240] to-[#111e15]",
    glow:      "rgba(125,168,130,0.35)",
    pattern:   `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Ccircle cx='14' cy='14' r='1.2' fill='rgba(255,255,255,0.10)'/%3E%3Ccircle cx='0' cy='0' r='1.2' fill='rgba(255,255,255,0.10)'/%3E%3Ccircle cx='28' cy='0' r='1.2' fill='rgba(255,255,255,0.10)'/%3E%3Ccircle cx='0' cy='28' r='1.2' fill='rgba(255,255,255,0.10)'/%3E%3Ccircle cx='28' cy='28' r='1.2' fill='rgba(255,255,255,0.10)'/%3E%3C/svg%3E")`,
    textColor: "text-cream",
    roleColor: "bg-sage/15 text-sage-light/80 border-sage/20",
  },
] as const;

// ─── Card decorations ─────────────────────────────────────────────────────────

function CardDecoration({ index }: { index: number }) {
  if (index === 0) {
    return (
      <>
        <div className="absolute top-4 right-4 text-white/45 pointer-events-none"><Code2 size={62} strokeWidth={1} /></div>
        <div className="absolute bottom-4 left-4 text-white/35 pointer-events-none"><Terminal size={38} strokeWidth={1} /></div>
        <div className="absolute top-5 left-5 text-white/25 pointer-events-none"><Cpu size={24} strokeWidth={1} /></div>
        <div className="absolute bottom-5 right-5 text-white/20 pointer-events-none"><Braces size={20} strokeWidth={1} /></div>
      </>
    );
  }
  if (index === 1) {
    return (
      <>
        <div className="absolute top-3 right-4 text-white/45 pointer-events-none"><Cake size={58} strokeWidth={1} /></div>
        <div className="absolute bottom-4 left-4 text-white/35 pointer-events-none"><UtensilsCrossed size={36} strokeWidth={1} /></div>
        <div className="absolute top-5 left-5 text-white/25 pointer-events-none"><Cookie size={22} strokeWidth={1} /></div>
        <div className="absolute bottom-5 right-5 text-white/20 pointer-events-none"><Cookie size={17} strokeWidth={1} /></div>
      </>
    );
  }
  if (index === 2) {
    return (
      <>
        <div className="absolute top-3 right-4 text-white/40 pointer-events-none"><Brain size={62} strokeWidth={1} /></div>
        <div className="absolute bottom-4 left-4 text-white/30 pointer-events-none"><Heart size={38} strokeWidth={1} /></div>
        <div className="absolute top-5 left-5 text-white/22 pointer-events-none"><Smile size={24} strokeWidth={1} /></div>
      </>
    );
  }
  return null;
}

// ─── Carousel ─────────────────────────────────────────────────────────────────

const INTERVAL_MS = 3600;

export function PartnersCarousel({ partners }: { partners: Partner[] }) {
  const trackRef  = useRef<HTMLDivElement>(null);
  const [current, setCurrent]   = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [paused,  setPaused]    = useState(false);

  // Detect mobile on mount + resize
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Auto-scroll: always on mobile, on desktop only if >3 cards
  const autoScrollOn = (isMobile || partners.length > 3) && !paused && partners.length > 1;

  const goTo = useCallback((raw: number) => {
    const i = ((raw % partners.length) + partners.length) % partners.length;
    setCurrent(i);
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[i] as HTMLElement;
    if (card) track.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
  }, [partners.length]);

  useEffect(() => {
    if (!autoScrollOn) return;
    const id = setInterval(() => goTo(current + 1), INTERVAL_MS);
    return () => clearInterval(id);
  }, [current, autoScrollOn, goTo]);

  // On desktop ≤3: no controls needed; on mobile or >3: show controls
  const showControls = isMobile || partners.length > 3;
  const showDots     = isMobile || partners.length > 3;

  // Card width class: mobile = 82vw (peek next), desktop = equal fill if ≤3, fixed 280px if >3
  const cardClass = isMobile
    ? "w-[82vw] flex-shrink-0"
    : partners.length > 3
      ? "w-[280px] flex-shrink-0"
      : "flex-1 min-w-0";

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Scroll track */}
      <div
        ref={trackRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {partners.map((partner, i) => {
          const palette = PALETTES[i % PALETTES.length];
          return (
            <div key={partner.name} className={cardClass}>
              <div className={`group relative rounded-3xl overflow-hidden flex flex-col items-center justify-center min-h-[180px] sm:min-h-[200px] px-6 py-7 text-center transition-all duration-300 h-full
                ${partner.url ? "cursor-pointer hover:-translate-y-1 hover:shadow-2xl" : ""}
              `}>
                {/* Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${palette.gradient}`} />
                <div className="absolute inset-0 opacity-100" style={{ backgroundImage: palette.pattern, backgroundSize: "22px 22px" }} />

                {/* Decorative icons */}
                <CardDecoration index={i} />

                {/* Radial glow */}
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-2/3 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at 50% 100%, ${palette.glow} 0%, transparent 70%)` }}
                />
                <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/20 to-transparent" />

                {/* Visit badge */}
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
                    <img src={partner.logoUrl} alt={partner.name} className="max-h-20 max-w-[80%] object-contain drop-shadow-lg" />
                  ) : (
                    <p className={`font-display font-bold leading-none tracking-tight ${palette.textColor} ${partner.name.length > 12 ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl"}`}>
                      {partner.name}
                    </p>
                  )}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full border text-[9px] uppercase tracking-[0.18em] font-semibold ${palette.roleColor}`}>
                    {partner.role}
                  </span>
                </div>

                {/* Hover ring */}
                <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/5 group-hover:ring-white/18 transition-all duration-300" />

                {/* Clickable overlay */}
                {partner.url && (
                  <Link href={partner.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-20" aria-label={`Visit ${partner.name}`} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Prev / Next controls */}
      {showControls && (
        <>
          <button
            onClick={() => { setPaused(false); goTo(current - 1); }}
            aria-label="Previous partner"
            className="absolute -left-5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-white/65 backdrop-blur-sm shadow-md border border-charcoal/10 flex items-center justify-center text-charcoal/60 hover:bg-white/90 hover:text-forest hover:shadow-lg transition-all z-30"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => { setPaused(false); goTo(current + 1); }}
            aria-label="Next partner"
            className="absolute -right-5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-white/65 backdrop-blur-sm shadow-md border border-charcoal/10 flex items-center justify-center text-charcoal/60 hover:bg-white/90 hover:text-forest hover:shadow-lg transition-all z-30"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {showDots && (
        <div className="flex justify-center gap-1.5 mt-5">
          {partners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to partner ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-5 h-2 bg-forest"
                  : "w-2 h-2 bg-charcoal/20 hover:bg-charcoal/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
