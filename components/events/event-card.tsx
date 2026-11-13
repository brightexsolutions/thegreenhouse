import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, ArrowUpRight, ArrowRight } from "lucide-react";
import { cn, formatEventTime } from "@/lib/utils";
import { storageUrl } from "@/lib/constants";
import type { PublicEvent } from "@/lib/public-event";

const STATUS_LABELS: Record<string, string> = {
  published: "Open",
  live:      "Live Now",
  past:      "Past Session",
  draft:     "Draft",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  published: "bg-black/60 text-gold border-gold/60",
  live:      "bg-black/60 text-green-300 border-green-400/60",
  past:      "bg-black/60 text-cream border-cream/40",
};

// Atmospheric fallback photos when an event has no uploaded cover
const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=75",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=75",
  "https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&w=800&q=75",
  "https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&w=800&q=75",
];

function pickFallback(slug: string): string {
  const hash = slug.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return FALLBACK_PHOTOS[hash % FALLBACK_PHOTOS.length];
}

interface EventCardProps {
  event:    PublicEvent;
  featured?: boolean;
}

export function EventCard({ event, featured = false }: EventCardProps) {
  const formattedDate = new Date(event.event_date).toLocaleDateString("en-KE", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
  const formattedTime = formatEventTime(event.event_time);
  const isPast = event.status === "past";

  // Cards always use banner_image — poster (cover_image) is for the detail page only
  const coverUrl = event.banner_image
    ? storageUrl(`event-images/${event.banner_image}`, { width: featured ? 1200 : 800, quality: 80 })
    : pickFallback(event.slug);

  return (
    <Link
      href={`/events/${event.slug}`}
      className={cn(
        "group relative rounded-3xl overflow-hidden block",
        "bg-forest-dark transition-transform duration-300",
        "hover:-translate-y-1 hover:shadow-card-hover",
        featured ? "aspect-[4/5] sm:aspect-[3/4]" : "aspect-[3/4]"
      )}
    >
      {/* Background photo */}
      <Image
        src={coverUrl}
        alt={event.title}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        sizes={featured ? "(max-width:768px) 100vw, 50vw" : "(max-width:768px) 100vw, 33vw"}
        unoptimized
      />

      {/* Scrim: posters are busy, so the lower half goes nearly solid to keep
          the title and details readable whatever artwork is behind them. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 from-0% via-black/70 via-40% to-black/5 to-75%" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 lg:p-7">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <span
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-semibold border tracking-wide uppercase",
              STATUS_COLORS[event.status] ?? "bg-black/50 text-cream border-cream/30"
            )}
          >
            {STATUS_LABELS[event.status] ?? event.status}
            {event.status === "live" && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 ml-1.5 animate-pulse-dot" />
            )}
          </span>
          <span className="w-8 h-8 rounded-full border border-cream/40 bg-black/40 flex items-center justify-center group-hover:border-gold group-hover:text-gold text-cream transition-colors duration-300">
            <ArrowUpRight size={13} />
          </span>
        </div>

        {/* Bottom content */}
        <div>
          {event.theme_title && (
            <div className="mb-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60 border border-gold/50">
                <span className="label-caps text-gold text-[10px]">Theme</span>
                <span className="text-xs font-semibold text-gold leading-none">{event.theme_title}</span>
              </div>
            </div>
          )}
          <h3 className="font-display text-2xl sm:text-3xl font-semibold text-cream leading-tight mb-3">
            {event.title}
          </h3>
          <div className="flex flex-col gap-1.5 mb-4">
            <div className="flex items-center gap-1.5 text-sm text-cream/90">
              <Calendar size={12} />
              <span>{formattedDate}{formattedTime ? ` · ${formattedTime}` : ""}</span>
            </div>
            {event.venue_name && (
              <div className="flex items-center gap-1.5 text-sm text-cream/90">
                <MapPin size={12} />
                <span>{event.venue_name}</span>
              </div>
            )}
          </div>
          {/* Explicit tap affordance */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-cream/90 group-hover:text-gold transition-colors duration-300 border-t border-cream/20 pt-3">
            <span>{isPast ? "View session recap" : "Register & view details"}</span>
            <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform duration-300" />
          </div>
        </div>
      </div>
    </Link>
  );
}
