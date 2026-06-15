import type { Metadata } from "next";
import { Leaf } from "lucide-react";
import { SECTIONS } from "@/components/docs/docs-shared";

export const metadata: Metadata = {
  title: "Platform Documentation — The Green House",
  robots: { index: false, follow: false },
};

const VERSION     = "v1.0";
const DATE_CREATED = "March 2026";
const DATE_UPDATED = "June 2026";

export default function PublicDocsPage() {
  return (
    <div className="min-h-screen bg-off-white flex flex-col">

      {/* ── Banner ── */}
      <header className="bg-forest text-cream">
        <div className="max-w-5xl mx-auto px-6 py-10 sm:py-14">

          {/* Branding row */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-cream/10 flex items-center justify-center flex-shrink-0">
              <Leaf size={18} className="text-cream/90" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cream/50">The Green House</p>
              <p className="text-xs text-cream/60 font-medium">Worship Community · Nairobi, Kenya</p>
            </div>
          </div>

          {/* Title + description */}
          <h1 className="font-display text-4xl sm:text-5xl font-light text-cream leading-tight mb-3">
            Platform Documentation
          </h1>
          <p className="text-sm sm:text-base text-cream/60 leading-relaxed max-w-xl">
            Full reference for the The Green House platform — covering events, registration, projection display, communications, check-in, library, and deployment. For team members running sessions.
          </p>

          {/* Meta chips */}
          <div className="flex flex-wrap items-center gap-2 mt-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-cream/10 border border-cream/20 text-[11px] font-semibold text-cream/80 tracking-wide">
              {VERSION}
            </span>
            <span className="text-cream/25 text-xs">·</span>
            <span className="text-[11px] text-cream/50">Created {DATE_CREATED}</span>
            <span className="text-cream/25 text-xs">·</span>
            <span className="text-[11px] text-cream/50">Last updated {DATE_UPDATED}</span>
          </div>
        </div>
      </header>

      {/* ── Body: sidebar + content ── */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 flex gap-8 items-start">

        {/* Sticky sidebar */}
        <nav className="hidden lg:block w-48 flex-shrink-0 sticky top-8 self-start">
          <p className="text-[10px] font-bold text-charcoal/35 uppercase tracking-widest mb-3 pl-1">Contents</p>
          <div className="space-y-0.5">
            {SECTIONS.map(({ id, icon: Icon, title, color }) => (
              <a
                key={id}
                href={`#${id}`}
                className="group flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-charcoal/55 hover:text-forest hover:bg-forest/5 transition-all"
              >
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 ${color} opacity-70 group-hover:opacity-100 transition-opacity`}>
                  <Icon size={10} />
                </div>
                <span className="leading-tight">{title}</span>
              </a>
            ))}
          </div>
        </nav>

        {/* Sections */}
        <div className="flex-1 min-w-0 space-y-6 pb-12">
          {SECTIONS.map(({ id, icon: Icon, title, color, content }) => (
            <div key={id} id={id} className="bg-white rounded-2xl border border-mist overflow-hidden scroll-mt-6">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-mist bg-off-white/50">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon size={15} />
                </div>
                <h2 className="text-sm font-semibold text-charcoal">{title}</h2>
              </div>
              <div className="px-5 py-4">
                {content}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footnotes ── */}
      <footer className="border-t border-mist bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-forest/8 flex items-center justify-center">
              <Leaf size={12} className="text-forest" />
            </div>
            <div>
              <p className="text-xs font-semibold text-charcoal">The Green House</p>
              <p className="text-[10px] text-charcoal/45">Worship Community · Nairobi, Kenya</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-[11px] text-charcoal/40 text-center sm:text-right">
            <span>
              Built by{" "}
              <a
                href="https://brightexsolutions.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-charcoal/60 hover:text-forest transition-colors font-medium"
              >
                Brightex Solutions
              </a>
            </span>
            <span className="hidden sm:inline text-charcoal/20">·</span>
            <span>{VERSION} · {DATE_UPDATED}</span>
            <span className="hidden sm:inline text-charcoal/20">·</span>
            <span>© {new Date().getFullYear()} The Green House Worship Community</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
