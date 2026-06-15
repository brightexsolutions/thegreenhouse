"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, MapPin, Leaf } from "lucide-react";
import { RegistrationForm } from "@/components/registration/registration-form";
import type { Event } from "@/types/database";

interface RegistrationModalProps {
  event: Event;
  trigger?: React.ReactNode;
}

export function RegistrationModal({ event, trigger }: RegistrationModalProps) {
  const [open,    setOpen]    = useState(false);
  const [mounted, setMounted] = useState(false);

  // Portal needs document to exist — auto-open if ?register=1 is in URL
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("register") === "1") {
      setOpen(true);
    }
  }, []);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const formattedDate = new Date(event.event_date).toLocaleDateString("en-KE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const modal = (
    /*
     * Rendered via createPortal directly under <body> so no ancestor
     * stacking context (transform, will-change, etc.) can clip the z-index.
     */
    <div className="fixed inset-0 z-[9999] flex flex-col sm:items-center sm:justify-center">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/*
       * Sheet:
       *  Mobile  → slides up from bottom, rounded top corners, fills remaining height
       *  Desktop → centred card, capped at 640px wide & 92vh tall
       */}
      <div
        className="relative z-10 flex flex-col
                   mt-auto w-full max-h-[92vh] rounded-t-[2rem]
                   sm:mt-0 sm:max-w-[580px] sm:max-h-[88vh] sm:rounded-[2rem]
                   bg-cream shadow-2xl overflow-hidden"
      >
        {/* Accent bar */}
        <div className="flex-none h-1 bg-gradient-to-r from-forest via-moss to-gold" />

        {/* Drag pill — mobile only */}
        <div className="flex-none flex justify-center pt-2.5 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-charcoal/20" />
        </div>

        {/* Fixed header */}
        <div className="flex-none px-5 pt-3 pb-3.5 border-b border-mist bg-cream">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Leaf size={10} className="text-gold" />
                <span className="label-caps text-gold text-[10px]">Reserve your spot</span>
              </div>
              <h2 className="font-display text-lg sm:text-xl font-semibold text-forest leading-tight">
                {event.title}
              </h2>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                <div className="flex items-center gap-1 text-[11px] text-charcoal/55">
                  <Calendar size={10} />
                  <span>{formattedDate}</span>
                </div>
                {event.venue_name && event.venue_name !== "TBA" && (
                  <div className="flex items-center gap-1 text-[11px] text-charcoal/55">
                    <MapPin size={10} />
                    <span>{event.venue_name}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full border border-mist flex items-center justify-center text-charcoal/45 hover:text-charcoal hover:border-charcoal/25 transition-all flex-shrink-0 mt-0.5"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Scrollable form area */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <RegistrationForm
            event={{
              id:          event.id,
              slug:        event.slug,
              title:       event.title,
              event_date:  event.event_date,
              venue_name:  event.venue_name,
              theme_title: (event as { theme_title?: string | null }).theme_title ?? null,
            }}
            onSuccess={() => {}}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Trigger */}
      <div onClick={() => setOpen(true)}>
        {trigger ?? (
          <button className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-forest text-cream font-semibold text-sm hover:bg-moss transition-all duration-200">
            Register — it&apos;s free
          </button>
        )}
      </div>

      {/* Modal rendered directly under <body> via portal — guarantees it sits above nav, footer, and all other layers */}
      {mounted && open && createPortal(modal, document.body)}
    </>
  );
}
