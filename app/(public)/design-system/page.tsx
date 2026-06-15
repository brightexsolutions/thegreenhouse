import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Brand System — The Green House",
  description: "The complete visual language for The Green House — color, typography, components, motion, and voice.",
  robots: { index: false, follow: false },
};

const COLORS = {
  greens: [
    { name: "Forest",      hex: "#1b3a2a", label: "Primary — nav, hero, footer" },
    { name: "Forest Dark", hex: "#0d1a12", label: "Deep bg — hero underlay" },
    { name: "Moss",        hex: "#2d5240", label: "Hover states, mid tones" },
    { name: "Sage",        hex: "#4e7a5e", label: "Secondary accents" },
    { name: "Sage Light",  hex: "#7fa98a", label: "Muted green elements" },
  ],
  gold: [
    { name: "Gold",        hex: "#c9a24a", label: "Primary accent — CTAs, highlights" },
    { name: "Gold Light",  hex: "#e4c97e", label: "Hover gold" },
    { name: "Gold Pale",   hex: "#f5edce", label: "Gold tint bg" },
  ],
  neutrals: [
    { name: "Cream",       hex: "#f7f2e8", label: "Page background, text on dark" },
    { name: "Off-White",   hex: "#f0ebe0", label: "Subtle section bg" },
    { name: "Mist",        hex: "#e4ddd0", label: "Borders, dividers" },
    { name: "Charcoal",    hex: "#1a1a18", label: "Body text" },
    { name: "Bark",        hex: "#5c4a35", label: "Warm muted text" },
  ],
};

function SectionLabel({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <span className="text-[11px] font-mono font-semibold text-charcoal/35 tracking-widest uppercase">{n}</span>
      <div className="h-px flex-1 bg-mist" />
      <span className="text-[11px] font-mono font-semibold text-charcoal/35 tracking-widest uppercase">{title}</span>
      <div className="h-px flex-1 bg-mist" />
    </div>
  );
}

function DSBlock({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div className={`rounded-2xl border p-7 mb-4 ${dark ? "bg-forest border-cream/8" : "bg-white border-mist"}`}>
      {children}
    </div>
  );
}

function TypeTag({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] mb-4 ${light ? "text-cream/40" : "text-charcoal/40"}`}>
      {children}
    </p>
  );
}

export default function DesignSystemPage() {
  return (
    <>
      {/* ── Dark hero ── */}
      <header className="bg-forest-dark text-cream relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background: [
            "radial-gradient(ellipse 70% 60% at 70% 30%, rgba(201,162,74,0.08) 0%, transparent 65%)",
            "radial-gradient(ellipse 50% 80% at 10% 90%, rgba(45,82,64,0.25) 0%, transparent 55%)",
          ].join(", "),
        }} />
        <div className="relative max-w-5xl mx-auto px-6 py-16 sm:py-20">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[11px] text-cream/40 mb-8 font-medium tracking-wide uppercase">
            <Link href="/" className="hover:text-cream/70 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-cream/60">Brand System</span>
          </nav>

          <h1 className="font-display text-5xl sm:text-6xl font-light text-cream leading-tight mb-4">
            Brand <em className="not-italic text-gold">System</em>
          </h1>
          <p className="text-cream/55 text-base sm:text-lg max-w-xl leading-relaxed mb-10">
            The complete visual language for The Green House — color, typography, spacing, components, motion, and voice.
          </p>

          {/* TOC pill row */}
          <div className="flex flex-wrap gap-2">
            {["Colors", "Typography", "Buttons", "Components", "Spacing", "Motion", "Voice & Tone"].map((s) => (
              <a
                key={s}
                href={`#${s.toLowerCase().replace(/[^a-z]/g, "-")}`}
                className="px-4 py-2 rounded-full border border-cream/15 text-[11px] font-semibold uppercase tracking-widest text-cream/55 hover:border-gold/50 hover:text-gold transition-all duration-150"
              >
                {s}
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="bg-off-white">
        <div className="max-w-5xl mx-auto px-6 py-16 space-y-20">

          {/* 01 — Colors */}
          <section id="colors" className="scroll-mt-20">
            <SectionLabel n="01" title="Color Palette" />

            <div className="space-y-8">
              {/* Greens */}
              <DSBlock>
                <TypeTag>Greens — carry the brand identity</TypeTag>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {COLORS.greens.map(({ name, hex, label }) => (
                    <div key={hex}>
                      <div className="h-20 rounded-xl mb-2.5" style={{ backgroundColor: hex }} />
                      <p className="text-xs font-semibold text-charcoal mb-0.5">{name}</p>
                      <p className="font-mono text-[10px] text-charcoal/45">{hex}</p>
                      <p className="text-[10px] text-charcoal/35 leading-tight mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </DSBlock>

              {/* Gold */}
              <DSBlock>
                <TypeTag>Gold — accent, never overuse</TypeTag>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {COLORS.gold.map(({ name, hex, label }) => (
                    <div key={hex}>
                      <div className="h-20 rounded-xl mb-2.5" style={{ backgroundColor: hex }} />
                      <p className="text-xs font-semibold text-charcoal mb-0.5">{name}</p>
                      <p className="font-mono text-[10px] text-charcoal/45">{hex}</p>
                      <p className="text-[10px] text-charcoal/35 leading-tight mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </DSBlock>

              {/* Neutrals */}
              <DSBlock>
                <TypeTag>Neutrals — carry most page weight</TypeTag>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {COLORS.neutrals.map(({ name, hex, label }) => (
                    <div key={hex}>
                      <div className="h-20 rounded-xl mb-2.5 border border-mist/60" style={{ backgroundColor: hex }} />
                      <p className="text-xs font-semibold text-charcoal mb-0.5">{name}</p>
                      <p className="font-mono text-[10px] text-charcoal/45">{hex}</p>
                      <p className="text-[10px] text-charcoal/35 leading-tight mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </DSBlock>
            </div>
          </section>

          {/* 02 — Typography */}
          <section id="typography" className="scroll-mt-20">
            <SectionLabel n="02" title="Typography" />

            <div className="space-y-4">
              <DSBlock>
                <TypeTag>Cormorant Garamond — Display · Hero headlines · Section titles</TypeTag>
                <div className="font-display text-[clamp(48px,7vw,80px)] font-light text-charcoal leading-[0.92] tracking-tight mb-4">
                  A place to <em className="not-italic text-gold">breathe</em>
                </div>
                <div className="font-display text-4xl font-normal text-charcoal tracking-tight mb-3">
                  Section Heading — 36px / Weight 400
                </div>
                <div className="font-display text-2xl italic text-gold mb-4">
                  Italic em phrase — sub-heading / 24px
                </div>
                <code className="text-[10px] font-mono text-charcoal/40 bg-off-white px-2 py-1 rounded">
                  font-family: &apos;Cormorant Garamond&apos;, Georgia, serif — var(--font-display)
                </code>
              </DSBlock>

              <DSBlock>
                <TypeTag>DM Sans — Interface · Body copy · Navigation · Buttons</TypeTag>
                <p className="text-lg font-medium text-charcoal mb-3">UI Heading — DM Sans 500 / 18px</p>
                <p className="text-sm text-charcoal/65 leading-relaxed max-w-xl mb-4">
                  Body regular — A quarterly cross-church gathering in Nairobi. Low pressure, real connection, everyone welcome. Each session is a curated evening of worship, sharing, and stillness.
                </p>
                <div className="flex flex-wrap gap-5 items-center mb-4">
                  <span className="label-caps text-gold/80 tracking-widest text-[10px]">Nairobi · Quarterly</span>
                  <span className="text-[10px] text-charcoal/35 uppercase tracking-widest font-semibold">Label Caps / 10px</span>
                  <span className="text-xs text-charcoal/40">Caption · Muted</span>
                </div>
                <code className="text-[10px] font-mono text-charcoal/40 bg-off-white px-2 py-1 rounded">
                  font-family: &apos;DM Sans&apos;, system-ui, sans-serif — var(--font-sans)
                </code>
              </DSBlock>
            </div>
          </section>

          {/* 03 — Buttons */}
          <section id="buttons" className="scroll-mt-20">
            <SectionLabel n="03" title="Buttons & CTAs" />

            <div className="space-y-4">
              <DSBlock>
                <TypeTag>On light backgrounds</TypeTag>
                <div className="flex flex-wrap gap-3">
                  <a href="/events" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold text-forest font-semibold text-sm hover:bg-gold-light transition-all duration-200">
                    Primary · Gold <ArrowRight size={14} />
                  </a>
                  <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-forest text-forest font-medium text-sm hover:bg-forest hover:text-cream transition-all duration-200">
                    Outline · Forest
                  </button>
                  <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-mist text-charcoal/70 font-medium text-sm hover:border-charcoal/30 hover:text-charcoal transition-all duration-200">
                    Secondary
                  </button>
                  <button className="inline-flex items-center gap-2 text-forest font-medium text-sm hover:text-moss transition-colors duration-200">
                    Ghost link <ArrowRight size={14} />
                  </button>
                </div>
              </DSBlock>

              <DSBlock dark>
                <TypeTag light>On dark backgrounds</TypeTag>
                <div className="flex flex-wrap gap-3">
                  <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold text-forest font-semibold text-sm hover:bg-gold-light transition-all duration-200">
                    Primary · Gold <ArrowRight size={14} />
                  </button>
                  <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-cream/20 text-cream/80 font-medium text-sm hover:border-cream/40 hover:text-cream transition-all duration-200">
                    Outline · Cream
                  </button>
                  <button className="inline-flex items-center gap-2 text-cream/70 font-medium text-sm hover:text-cream transition-colors duration-200">
                    Ghost on dark <ArrowRight size={14} />
                  </button>
                </div>
              </DSBlock>

              <div className="bg-white border border-mist rounded-xl px-5 py-3.5 text-sm text-charcoal/55">
                <strong className="text-charcoal">Spec:</strong> DM Sans · 14px / 600 · rounded-full · px-6 py-3 · 200ms transition · hover:-translate-y-0.5 on primary
              </div>
            </div>
          </section>

          {/* 04 — Components */}
          <section id="components" className="scroll-mt-20">
            <SectionLabel n="04" title="Components" />

            <div className="space-y-4">
              {/* Eyebrow pattern */}
              <div className="text-[11px] font-semibold uppercase tracking-widest text-charcoal/40 mb-3">Eyebrow + Heading Pattern — used above every major section</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <DSBlock>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    <span className="label-caps text-gold/80 tracking-widest text-[10px]">Nairobi · Quarterly</span>
                  </div>
                  <div className="font-display text-3xl font-light text-charcoal leading-tight">
                    Section <em className="not-italic text-gold">Title</em> Here
                  </div>
                </DSBlock>
                <DSBlock dark>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                    <span className="label-caps text-gold/80 tracking-widest text-[10px]">Nairobi · Quarterly</span>
                  </div>
                  <div className="font-display text-3xl font-light text-cream leading-tight">
                    Dark Section <em className="not-italic text-gold">Title</em>
                  </div>
                </DSBlock>
              </div>

              {/* Session badge + stat chip */}
              <DSBlock>
                <TypeTag>Badges & Chips</TypeTag>
                <div className="flex flex-wrap gap-4 items-start">
                  <div className="bg-forest/80 backdrop-blur-sm border border-gold/30 rounded-2xl px-4 py-2.5 shadow-lg">
                    <span className="font-display text-xl font-semibold text-cream">02</span>
                    <p className="text-xs text-cream/70 mt-0.5 uppercase tracking-wider">Session</p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-xs font-semibold text-gold">
                    Live Now
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest/8 text-xs font-medium text-forest">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Session Open
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-charcoal/6 text-xs font-semibold text-charcoal/60">
                    Past Event
                  </span>
                </div>
              </DSBlock>

              {/* Section icon tiles */}
              <DSBlock>
                <TypeTag>Icon Tiles — used in docs and feature lists</TypeTag>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: "Events",    color: "bg-forest/10 text-forest" },
                    { label: "Tickets",   color: "bg-gold/10 text-gold" },
                    { label: "Live",      color: "bg-purple-100 text-purple-600" },
                    { label: "Check-in",  color: "bg-sky-100 text-sky-600" },
                    { label: "Admin",     color: "bg-rose-100 text-rose-600" },
                  ].map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-2.5 px-3 py-2 bg-off-white rounded-xl border border-mist">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${color}`}>
                        {label[0]}
                      </div>
                      <span className="text-xs font-medium text-charcoal">{label}</span>
                    </div>
                  ))}
                </div>
              </DSBlock>

              {/* Card pattern */}
              <DSBlock dark>
                <TypeTag light>Event Card — dark with radial gold glow</TypeTag>
                <div className="relative rounded-2xl overflow-hidden border border-cream/8 bg-forest max-w-xs">
                  <div className="absolute inset-0" style={{
                    background: "radial-gradient(ellipse 80% 60% at 20% 80%, rgba(201,162,74,0.15) 0%, transparent 65%)",
                  }} />
                  <div className="relative p-5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gold/15 text-[10px] font-semibold text-gold uppercase tracking-wider mb-4">
                      Published
                    </span>
                    <div className="font-display text-xl font-light text-cream mb-1">Session 02</div>
                    <p className="text-xs text-cream/50">26 June 2026 · Nairobi, Kenya</p>
                    <div className="mt-4 h-px bg-cream/8" />
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-cream/40">Free entry</span>
                      <span className="text-xs text-gold hover:text-gold-light transition-colors cursor-pointer">Register →</span>
                    </div>
                  </div>
                </div>
              </DSBlock>
            </div>
          </section>

          {/* 05 — Spacing */}
          <section id="spacing" className="scroll-mt-20">
            <SectionLabel n="05" title="Spacing System" />

            <DSBlock>
              <TypeTag>4px base unit — all spacing is a multiple of 4</TypeTag>
              <div className="flex items-end gap-4 flex-wrap mb-8">
                {[
                  { size: 4,  label: "4" },
                  { size: 8,  label: "8" },
                  { size: 12, label: "12" },
                  { size: 16, label: "16" },
                  { size: 24, label: "24" },
                  { size: 32, label: "32" },
                  { size: 48, label: "48" },
                  { size: 64, label: "64" },
                  { size: 96, label: "96 ← section" },
                ].map(({ size, label }) => (
                  <div key={size} className="text-center">
                    <div
                      className="bg-gold/80 rounded mx-auto mb-2"
                      style={{ width: Math.min(size, 64), height: Math.min(size, 64) }}
                    />
                    <span className="text-[10px] text-charcoal/40 font-mono">{label}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="bg-off-white rounded-xl border border-mist p-4">
                  <p className="font-semibold text-charcoal mb-1">Section Padding</p>
                  <p className="text-charcoal/55 text-xs">96px top/bottom desktop · 64px tablet · 48px mobile</p>
                </div>
                <div className="bg-off-white rounded-xl border border-mist p-4">
                  <p className="font-semibold text-charcoal mb-1">Card Padding</p>
                  <p className="text-charcoal/55 text-xs">20–28px internal · rounded-2xl (1rem) consistently</p>
                </div>
                <div className="bg-off-white rounded-xl border border-mist p-4">
                  <p className="font-semibold text-charcoal mb-1">Grid Gap</p>
                  <p className="text-charcoal/55 text-xs">16–24px card grids · 32–48px on split 2-col layouts</p>
                </div>
              </div>
            </DSBlock>
          </section>

          {/* 06 — Motion */}
          <section id="motion" className="scroll-mt-20">
            <SectionLabel n="06" title="Motion & Animation" />

            <div className="space-y-4">
              <DSBlock>
                <TypeTag>Entrance animations — FadeIn / FadeInStagger</TypeTag>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-charcoal/70">
                  <div className="bg-off-white rounded-xl border border-mist p-4">
                    <p className="font-semibold text-charcoal mb-2">FadeIn</p>
                    <code className="text-[10px] font-mono text-charcoal/45 block">opacity: 0→1, y: 24→0</code>
                    <code className="text-[10px] font-mono text-charcoal/45 block">duration: 0.65s · ease [0.16,1,0.3,1]</code>
                  </div>
                  <div className="bg-off-white rounded-xl border border-mist p-4">
                    <p className="font-semibold text-charcoal mb-2">Float Loop</p>
                    <code className="text-[10px] font-mono text-charcoal/45 block">y: 0→-12→0</code>
                    <code className="text-[10px] font-mono text-charcoal/45 block">duration: 3.6–4.8s · easeInOut · ∞</code>
                  </div>
                  <div className="bg-off-white rounded-xl border border-mist p-4">
                    <p className="font-semibold text-charcoal mb-2">Ripple Expand</p>
                    <code className="text-[10px] font-mono text-charcoal/45 block">scale: 1→1.7 · opacity: 0.5→0</code>
                    <code className="text-[10px] font-mono text-charcoal/45 block">duration: 5s · easeOut · ∞</code>
                  </div>
                </div>
              </DSBlock>

              <DSBlock>
                <TypeTag>Reduced motion — always respected</TypeTag>
                <p className="text-sm text-charcoal/60 leading-relaxed max-w-xl">
                  All animated elements check <code className="font-mono text-xs bg-off-white px-1.5 py-0.5 rounded text-charcoal/70">useReducedMotion()</code> from Framer Motion.
                  When enabled, float loops and ripple pulses are suppressed. Entrance animations (opacity/y) still run as they are non-looping and brief.
                </p>
              </DSBlock>
            </div>
          </section>

          {/* 07 — Voice & Tone */}
          <section id="voice---tone" className="scroll-mt-20">
            <SectionLabel n="07" title="Voice & Tone" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DSBlock>
                <TypeTag>Do</TypeTag>
                <ul className="space-y-3 text-sm text-charcoal/70">
                  <li className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">✓</span>
                    Short headlines — 6 words or fewer
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">✓</span>
                    Use <em className="text-gold not-italic font-medium">em italics</em> for gold accent phrases in headlines
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">✓</span>
                    Body text under 2 lines per block — let imagery carry weight
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">✓</span>
                    Warm and direct — &ldquo;All welcome.&rdquo; not &ldquo;We warmly invite you to join us.&rdquo;
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">✓</span>
                    Label caps for categories — UPPERCASE 10px with wide tracking
                  </li>
                </ul>
              </DSBlock>

              <DSBlock>
                <TypeTag>Don&apos;t</TypeTag>
                <ul className="space-y-3 text-sm text-charcoal/70">
                  <li className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">✗</span>
                    Walls of text — no paragraph blocks longer than 2 sentences per section
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">✗</span>
                    Generic church copy — avoid &ldquo;Come as you are and experience God&rsquo;s presence&rdquo;
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">✗</span>
                    Exclamation marks — restraint conveys confidence
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">✗</span>
                    Color as decoration — gold appears intentionally, not casually
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">✗</span>
                    &ldquo;Monthly&rdquo; — the gathering is quarterly
                  </li>
                </ul>
              </DSBlock>
            </div>
          </section>

        </div>
      </main>
    </>
  );
}
