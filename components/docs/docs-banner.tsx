"use client";

import { useState, useEffect } from "react";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

const VERSION      = "v1.0";
const DATE_CREATED = "March 2026";
const DATE_UPDATED = "June 2026";

export function DocsBanner() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* ── Full hero banner ── */}
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

          <h1 className="font-display text-4xl sm:text-5xl font-light text-cream leading-tight mb-3">
            Platform Documentation
          </h1>
          <p className="text-sm sm:text-base text-cream/60 leading-relaxed max-w-xl">
            Full reference for the The Green House platform — covering events, registration, projection display, communications, check-in, library, and deployment. For team members running sessions.
          </p>

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

      {/* ── Compact sticky banner (appears on scroll) ── */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out",
          "bg-forest/96 backdrop-blur-md border-b border-cream/10 shadow-lg",
          scrolled ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div className="max-w-5xl mx-auto px-6 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-cream/10 flex items-center justify-center flex-shrink-0">
              <Leaf size={11} className="text-gold" />
            </div>
            <span className="text-xs font-semibold text-cream truncate">The Green House</span>
            <span className="text-cream/25 text-[10px] hidden sm:inline">·</span>
            <span className="text-[11px] text-cream/55 hidden sm:inline truncate">Platform Documentation</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-cream/40 flex-shrink-0">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-cream/8 border border-cream/15 font-semibold text-cream/60">
              {VERSION}
            </span>
            <span className="text-cream/20 hidden sm:inline">·</span>
            <span className="hidden sm:inline">Updated {DATE_UPDATED}</span>
          </div>
        </div>
      </div>
    </>
  );
}
