"use client";

import Image from "next/image";
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
    { label: "Days",  value: timeLeft.days    },
    { label: "Hours", value: timeLeft.hours   },
    { label: "Min",   value: timeLeft.minutes },
    { label: "Sec",   value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      {units.map((u, i) => (
        <div key={u.label} className="flex items-center gap-2 sm:gap-4">
          <div className="flex flex-col items-center min-w-[48px]">
            <span className="font-display text-4xl sm:text-5xl font-semibold text-cream tabular-nums leading-none">
              {String(u.value).padStart(2, "0")}
            </span>
            <span className="label-caps text-cream/45 text-[10px] mt-1.5">{u.label}</span>
          </div>
          {i < units.length - 1 && (
            <span className="text-gold/60 font-semibold text-2xl mb-4 leading-none">:</span>
          )}
        </div>
      ))}
    </div>
  );
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export function EventTeaser({ event }: { event: Event | null }) {
  if (!event) return null;

  const eventDateTime = `${event.event_date}T${event.event_time}`;
  const formattedDate = new Date(event.event_date).toLocaleDateString("en-KE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const formattedTime = event.event_time.slice(0, 5).replace(":", ".");
  const coverUrl = event.cover_image
    ? `${SUPABASE_URL}/storage/v1/object/public/event-images/${event.cover_image}`
    : null;

  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-forest">
      {/* Background texture — more visible */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=70"
          alt=""
          fill
          className="object-cover opacity-35"
          sizes="100vw"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-forest/95 via-forest/80 to-moss/60" />
      </div>

      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(201,162,74,0.12),transparent)]" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — event details */}
          <FadeIn>
            <span className="label-caps text-gold/80">Next Session</span>
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-cream mt-2 mb-4 leading-tight">
              {event.title}
            </h2>
            {event.theme_title && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cream/10 border border-cream/20 mb-5">
                <span className="label-caps text-cream/50 text-xs">Theme</span>
                <span className="text-sm font-semibold text-cream">{event.theme_title}</span>
                {event.theme_scripture && (
                  <span className="text-sm text-cream/50">· {event.theme_scripture}</span>
                )}
              </div>
            )}
            <div className="flex flex-col gap-2.5 text-sm text-cream/60 mb-8">
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
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gold text-forest font-semibold text-sm hover:bg-gold-light transition-all duration-200 hover:-translate-y-0.5"
            >
              Reserve your spot <ArrowRight size={15} />
            </Link>
          </FadeIn>

          {/* Right — cover image + countdown */}
          <FadeIn delay={0.15} direction="right">
            <div className="flex flex-col gap-4">
              {/* Cover image — shown when available */}
              {coverUrl && (
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-cream/15">
                  <Image
                    src={coverUrl}
                    alt={event.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest/40 to-transparent" />
                </div>
              )}

              {/* Countdown card */}
              <div className="rounded-3xl border border-cream/15 bg-cream/8 backdrop-blur-sm p-8 lg:p-10">
                <p className="label-caps text-cream/40 text-xs mb-5">Counting down to {event.title.split("—").pop()?.trim() ?? "the session"}</p>
                <Countdown targetDate={eventDateTime} />
                <div className="mt-8 pt-6 border-t border-cream/15">
                  <p className="text-sm text-cream/40">
                    {event.type === "free" ? "Free entry · All welcome" : `KES ${event.price_kes?.toLocaleString()} entry`}
                    {event.capacity ? ` · ${event.capacity} spots` : ""}
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
