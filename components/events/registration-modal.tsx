"use client";

import { useState } from "react";
import { X, Calendar, MapPin, Leaf } from "lucide-react";
import { RegistrationForm } from "@/components/registration/registration-form";
import type { Event } from "@/types/database";

interface RegistrationModalProps {
  event: Event;
  trigger?: React.ReactNode;
}

export function RegistrationModal({ event, trigger }: RegistrationModalProps) {
  const [open, setOpen] = useState(false);

  const formattedDate = new Date(event.event_date).toLocaleDateString("en-KE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

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

      {open && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Positioning wrapper */}
          <div className="absolute inset-0 flex items-end sm:items-center justify-center sm:p-6">

            {/* Modal shell — NO overflow-hidden so the header never clips */}
            <div className="relative z-10 w-full sm:max-w-lg flex flex-col bg-cream rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl"
              style={{ maxHeight: "min(92vh, 760px)" }}
            >
              {/* Decorative top bar */}
              <div className="flex-none h-1 w-full rounded-t-[2rem] sm:rounded-t-[2rem] bg-gradient-to-r from-forest via-moss to-gold" />

              {/* Drag handle (mobile only) */}
              <div className="flex-none flex justify-center pt-2.5 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-charcoal/15" />
              </div>

              {/* Header — flex-none keeps it always visible */}
              <div className="flex-none px-6 pt-3 pb-4 border-b border-mist">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Leaf size={11} className="text-gold" />
                      <span className="label-caps text-gold text-xs">Registration</span>
                    </div>
                    <h2 className="font-display text-xl sm:text-2xl font-semibold text-forest leading-tight">
                      {event.title}
                    </h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-charcoal/55">
                        <Calendar size={11} />
                        <span>{formattedDate}</span>
                      </div>
                      {event.venue_name && event.venue_name !== "TBA" && (
                        <div className="flex items-center gap-1.5 text-xs text-charcoal/55">
                          <MapPin size={11} />
                          <span>{event.venue_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-8 h-8 rounded-full border border-mist flex items-center justify-center text-charcoal/40 hover:text-charcoal hover:border-charcoal/30 transition-all flex-shrink-0 mt-0.5"
                    aria-label="Close"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Scrollable form body — min-h-0 is required for overflow-y to activate in flex */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
                <RegistrationForm
                  event={{ id: event.id, slug: event.slug, title: event.title, event_date: event.event_date, venue_name: event.venue_name }}
                  onSuccess={() => setTimeout(() => setOpen(false), 3500)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
