import type { Metadata } from "next";
import { Leaf } from "lucide-react";
import { SECTIONS } from "@/components/docs/docs-shared";
import { DocsNav } from "@/components/docs/docs-nav";
import { DocsBanner } from "@/components/docs/docs-banner";

export const metadata: Metadata = {
  title: "Platform Documentation — The Green House",
  robots: { index: false, follow: false },
};

const VERSION      = "v1.0";
const DATE_UPDATED = "June 2026";

export default function PublicDocsPage() {
  return (
    <div className="min-h-screen bg-off-white flex flex-col">

      {/* ── Banner (client — handles scroll-aware compact sticky) ── */}
      <DocsBanner />

      {/* ── Body: sidebar + content ── */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 flex gap-8 items-start">

        {/* Sticky sidebar — offset accounts for the compact sticky banner height */}
        <nav className="hidden lg:block w-48 flex-shrink-0 sticky top-14 self-start">
          <p className="text-[10px] font-bold text-charcoal/35 uppercase tracking-widest mb-3 pl-1">Contents</p>
          <DocsNav />
        </nav>

        {/* Sections */}
        <div className="flex-1 min-w-0 space-y-6 pb-12">
          {SECTIONS.map(({ id, icon: Icon, title, color, content }) => (
            <div key={id} id={id} className="bg-white rounded-2xl border border-mist overflow-hidden scroll-mt-20">
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
                href="https://brightexsolutions.co.ke"
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
