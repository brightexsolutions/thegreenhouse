"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { X, Calendar, MapPin, ArrowRight } from "lucide-react";

interface SessionPromptProps {
  event: {
    slug:       string;
    title:      string;
    event_date: string;
    event_time: string;
    venue_name: string | null;
    theme_title?: string | null;
    type:       string;
    price_kes?: number | null;
  };
}

const SESSION_KEY = "gh_session_prompt_dismissed";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour   = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")}${suffix}`;
}

export function SessionPromptDialog({ event }: SessionPromptProps) {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Don't show on the events page — they're already there
    if (pathname.startsWith("/events")) return;
    // Don't show on admin/checkin/live
    if (pathname.startsWith("/admin") || pathname.startsWith("/checkin") || pathname.startsWith("/live")) return;

    // Show once per browser session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    // Small delay so the page loads first
    const t = setTimeout(() => setVisible(true), 1800);
    return () => clearTimeout(t);
  }, [pathname]);

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  const entryLabel = event.type === "paid" && event.price_kes
    ? `KES ${event.price_kes.toLocaleString()}`
    : "Free entry";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-forest/60 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Upcoming session"
        className="fixed z-[61] bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:max-w-lg sm:rounded-3xl overflow-hidden shadow-2xl"
        style={{ animation: "slideUp 0.35s cubic-bezier(0.32,0.72,0,1) both" }}
      >
        <style>{`
          @keyframes slideUp {
            from { opacity:0; transform: translateY(24px); }
            to   { opacity:1; transform: translateY(0); }
          }
          @media (min-width:640px) {
            @keyframes slideUp {
              from { opacity:0; transform: translate(-50%,calc(-50% + 20px)); }
              to   { opacity:1; transform: translate(-50%,-50%); }
            }
          }
        `}</style>

        {/* Header — forest green with gold accent */}
        <div className="relative bg-forest px-7 pt-8 pb-6 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(201,162,74,0.12),transparent)]" />
          <div className="absolute top-4 right-16 w-20 h-20 rounded-full border border-cream/5" />

          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X size={14} className="text-cream/70" />
          </button>

          <span className="label-caps text-gold/80 text-xs">Upcoming session</span>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-cream mt-1 leading-tight">
            {event.title}
          </h2>
          {event.theme_title && (
            <p className="text-gold/80 text-sm mt-1 italic">&ldquo;{event.theme_title}&rdquo;</p>
          )}
        </div>

        {/* Body */}
        <div className="bg-white px-7 py-6 space-y-3">
          <div className="flex items-start gap-3">
            <Calendar size={15} className="text-forest/50 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-forest">{formatDate(event.event_date)}</p>
              <p className="text-xs text-charcoal/50 mt-0.5">{formatTime(event.event_time)} · {entryLabel}</p>
            </div>
          </div>
          {event.venue_name && (
            <div className="flex items-start gap-3">
              <MapPin size={15} className="text-forest/50 mt-0.5 shrink-0" />
              <p className="text-sm text-charcoal/70">{event.venue_name}</p>
            </div>
          )}

          <p className="text-charcoal/55 text-sm leading-relaxed pt-1">
            We&apos;d love to have you. Grab your spot — it only takes a moment.
          </p>
        </div>

        {/* Actions */}
        <div className="bg-white px-7 pb-8 flex items-center gap-3">
          <Link
            href={`/events/${event.slug}`}
            onClick={dismiss}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-full bg-forest text-cream text-sm font-semibold hover:bg-moss transition-colors"
          >
            I&apos;d like to attend <ArrowRight size={14} />
          </Link>
          <button
            onClick={dismiss}
            className="px-5 py-3.5 rounded-full border border-mist text-charcoal/60 text-sm font-medium hover:border-charcoal/20 hover:text-charcoal/80 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </>
  );
}
