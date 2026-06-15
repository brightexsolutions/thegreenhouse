import { BookOpen } from "lucide-react";
import { SECTIONS } from "@/components/docs/docs-shared";
import { DocsNav } from "@/components/docs/docs-nav";

export const dynamic = "force-dynamic";

export default function AdminDocsPage() {
  return (
    /*
     * -m-6 escapes the main's p-6 padding so we can set up two independent
     * scroll columns that together fill the full admin content height.
     * Left column scrolls the docs; right sidebar stays fixed.
     */
    <div className="flex -m-6 h-[calc(100vh-3.5rem)] overflow-hidden">

      {/* ── Scrollable main content ── */}
      <div id="docs-content" className="flex-1 min-w-0 overflow-y-auto px-6 pt-6 pb-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-forest/8 flex items-center justify-center">
              <BookOpen size={16} className="text-forest" />
            </div>
            <h1 className="text-xl font-semibold text-charcoal">Platform Documentation</h1>
          </div>
          <p className="text-sm text-charcoal/50 ml-12">
            Full reference for running The Green House platform — from creating a gathering to deploying the site and getting it on Google.
          </p>
          <div className="ml-12 mt-2">
            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-forest/70 hover:text-forest transition-colors"
            >
              <span>↗ View shareable public version</span>
            </a>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {SECTIONS.map(({ id, icon: Icon, title, color, content }) => (
            <div key={id} id={id} className="bg-white rounded-2xl border border-mist overflow-hidden scroll-mt-4">
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

      {/* ── Right sidebar: Jump to section with scroll tracking ── */}
      <div className="w-52 flex-shrink-0 border-l border-mist overflow-y-auto px-4 py-6 hidden lg:block">
        <p className="text-[10px] font-bold text-charcoal/35 uppercase tracking-widest mb-3 pl-1">Jump to section</p>
        <DocsNav scrollContainerId="docs-content" />
      </div>

    </div>
  );
}
