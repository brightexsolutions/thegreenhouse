import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { storageUrl } from "@/lib/constants";
import type { Event } from "@/types/database";

const STATUS_LABELS: Record<string, string> = {
  published: "Open",
  live:      "Live Now",
  past:      "Past Session",
  draft:     "Draft",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  published: "bg-gold/15 text-gold border-gold/30",
  live:      "bg-green-500/20 text-green-400 border-green-500/30",
  past:      "bg-cream/10 text-cream/50 border-cream/20",
};

// Atmospheric fallback photos when an event has no uploaded cover
const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=75",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=75",
  "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=75",
  "https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&w=800&q=75",
];

function pickFallback(slug: string): string {
  const hash = slug.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return FALLBACK_PHOTOS[hash % FALLBACK_PHOTOS.length];
}

interface EventCardProps {
  event:    Event;
  featured?: boolean;
}

export function EventCard({ event, featured = false }: EventCardProps) {
  const formattedDate = new Date(event.event_date).toLocaleDateString("en-KE", {
    day: "numeric", month: "long", year: "numeric",
  });
  const formattedTime = event.event_time.slice(0, 5).replace(":", ".");
  const isPast = event.status === "past";

  const coverUrl = event.cover_image
    ? storageUrl(`event-images/${event.cover_image}`, { width: featured ? 1200 : 800, quality: 80 })
    : pickFallback(event.slug);

  return (
    <Link
      href={`/events/${event.slug}`}
      className={cn(
        "group relative rounded-3xl overflow-hidden block",
        "bg-forest-dark transition-all duration-500",
        "hover:-translate-y-1",
        featured ? "aspect-[4/5] sm:aspect-[3/4]" : "aspect-[3/4]",
        isPast && "opacity-75"
      )}
    >
      {/* Background photo */}
      <Image
        src={coverUrl}
        alt={event.title}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        sizes={featured ? "(max-width:768px) 100vw, 50vw" : "(max-width:768px) 100vw, 33vw"}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

      {/* Radial glow on hover */}
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[radial-gradient(circle,rgba(201,162,74,0.18),transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(circle, #fdfcf8 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Decorative ring */}
      <div className="absolute top-4 right-4 w-20 h-20 rounded-full border border-cream/10 group-hover:border-gold/25 group-hover:scale-110 transition-all duration-500" />

      {/* Bottom gold accent line */}
      <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gold group-hover:w-full transition-all duration-500 ease-out" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 lg:p-7">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <span
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-semibold border tracking-wide uppercase",
              STATUS_COLORS[event.status] ?? "bg-cream/10 text-cream/60 border-cream/20"
            )}
          >
            {STATUS_LABELS[event.status] ?? event.status}
            {event.status === "live" && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 ml-1.5 animate-pulse-dot" />
            )}
          </span>
          <span className="w-8 h-8 rounded-full border border-cream/20 flex items-center justify-center group-hover:border-gold/40 group-hover:text-gold text-cream/50 transition-all duration-300">
            <ArrowUpRight size={13} />
          </span>
        </div>

        {/* Bottom content */}
        <div>
          {event.theme_title && (
            <div className="mb-3">
              <span className="label-caps text-gold/70 text-xs">Theme</span>
              <p className="text-sm text-cream/70 mt-0.5 font-medium">{event.theme_title}</p>
            </div>
          )}
          <h3 className="font-display text-2xl sm:text-3xl font-semibold text-cream leading-tight mb-3">
            {event.title}
          </h3>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-sm text-cream/60">
              <Calendar size={12} />
              <span>{formattedDate} · {formattedTime}pm</span>
            </div>
            {event.venue_name && (
              <div className="flex items-center gap-1.5 text-sm text-cream/60">
                <MapPin size={12} />
                <span>{event.venue_name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
