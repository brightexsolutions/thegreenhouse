"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import type { Event } from "@/types/database";

function Countdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    function calc() {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return;
      setTimeLeft({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const units = [
    { label: "Days",    value: timeLeft.days    },
    { label: "Hours",   value: timeLeft.hours   },
    { label: "Min",     value: timeLeft.minutes },
    { label: "Sec",     value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center gap-3">
      {units.map((u, i) => (
        <div key={u.label} className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <span className="font-display text-3xl font-semibold text-forest tabular-nums">
              {String(u.value).padStart(2, "0")}
            </span>
            <span className="label-caps text-charcoal/40" style={{ fontSize: "9px" }}>{u.label}</span>
          </div>
          {i < units.length - 1 && (
            <span className="text-gold font-semibold text-xl mb-3">:</span>
          )}
        </div>
      ))}
    </div>
  );
}

interface EventTeaserProps {
  event: Event | null;
}

export function EventTeaser({ event }: EventTeaserProps) {
  if (!event) return null;

  const eventDateTime = `${event.event_date}T${event.event_time}`;
  const formattedDate = new Date(event.event_date).toLocaleDateString("en-KE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const formattedTime = event.event_time.slice(0, 5).replace(":", ".");

  return (
    <section
      className="py-20 md:py-28 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #f7f2e8 0%, #ede8d8 55%, #f7f2e8 100%)" }}
    >
      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(201,162,74,0.08),transparent)]" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <FadeIn>
            <span className="label-caps text-gold">Next Session</span>
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-forest mt-2 mb-4 leading-tight">
              {event.title}
            </h2>
            {event.theme_title && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest/8 border border-forest/15 mb-5">
                <span className="label-caps text-forest/60">Theme</span>
                <span className="text-xs font-semibold text-forest">{event.theme_title}</span>
                {event.theme_scripture && (
                  <span className="text-xs text-forest/50">· {event.theme_scripture}</span>
                )}
              </div>
            )}
            <div className="flex flex-col gap-2.5 text-sm text-charcoal/60 mb-8">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gold shrink-0" />
                <span>{formattedDate} · {formattedTime}pm</span>
              </div>
              {event.venue_name && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gold shrink-0" />
                  <span>{event.venue_name}</span>
                </div>
              )}
            </div>
            <Link
              href={`/events/${event.slug}`}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-forest text-cream font-semibold text-sm hover:bg-moss transition-all duration-200 hover:-translate-y-0.5 shadow-card hover:shadow-card-hover"
            >
              Reserve your spot
              <ArrowRight size={15} />
            </Link>
          </FadeIn>

          {/* Right — countdown */}
          <FadeIn delay={0.15} direction="right">
            <div className="rounded-3xl border border-mist bg-off-white/60 backdrop-blur-sm p-8 lg:p-10 shadow-card">
              <p className="label-caps text-charcoal/40 mb-5">Counting down</p>
              <Countdown targetDate={eventDateTime} />
              <div className="mt-8 pt-6 border-t border-mist">
                <p className="text-xs text-charcoal/40">
                  {event.type === "free" ? "Free entry" : `KES ${event.price_kes?.toLocaleString()} entry`}
                  {event.capacity && ` · ${event.capacity} spots`}
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
