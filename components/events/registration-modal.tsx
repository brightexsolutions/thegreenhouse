"use client";

import { useState } from "react";
import { X, Calendar, MapPin } from "lucide-react";
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
          <button className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-forest text-cream font-semibold text-sm hover:bg-moss transition-all duration-200">
            Register — it&apos;s free
          </button>
        )}
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Modal */}
          <div className="relative w-full sm:max-w-md bg-cream rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[92dvh] flex flex-col">
            {/* Handle (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-charcoal/15" />
            </div>

            {/* Header */}
            <div className="px-6 pt-4 pb-5 border-b border-mist flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="label-caps text-gold text-[9px]">Registration</span>
                  <h2 className="font-display text-xl sm:text-2xl font-semibold text-forest mt-0.5 leading-tight">
                    {event.title}
                  </h2>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-charcoal/50">
                      <Calendar size={10} />
                      <span>{formattedDate}</span>
                    </div>
                    {event.venue_name && (
                      <div className="flex items-center gap-1.5 text-[11px] text-charcoal/50">
                        <MapPin size={10} />
                        <span>{event.venue_name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full border border-mist flex items-center justify-center text-charcoal/40 hover:text-charcoal hover:border-charcoal/20 transition-all flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <RegistrationForm
                event={{ id: event.id, slug: event.slug, title: event.title, event_date: event.event_date, venue_name: event.venue_name }}
                onSuccess={() => setTimeout(() => setOpen(false), 3000)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
