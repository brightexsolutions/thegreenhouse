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
  past:      "bg-cream/10 text-cream/40 border-cream/15",
};

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
    : null;

  return (
    <Link
      href={`/events/${event.slug}`}
      className={cn(
        "group relative rounded-3xl overflow-hidden block",
        "bg-forest-dark transition-all duration-500",
        "hover:-translate-y-1",
        featured ? "aspect-[4/5] sm:aspect-[3/4]" : "aspect-[3/4]",
        isPast && "opacity-70"
      )}
    >
      {/* Background image / gradient */}
      {coverUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${coverUrl})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-moss/80 via-forest to-forest-dark" />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Radial glow */}
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[radial-gradient(circle,rgba(201,162,74,0.15),transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, #fdfcf8 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Decorative ring */}
      <div className="absolute top-4 right-4 w-20 h-20 rounded-full border border-cream/10 group-hover:border-gold/20 group-hover:scale-110 transition-all duration-500" />

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gold group-hover:w-full transition-all duration-500 ease-out" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 lg:p-7">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <span
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-semibold border tracking-wider uppercase",
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
              <span className="label-caps text-gold/70" style={{ fontSize: "9px" }}>Theme</span>
              <p className="text-xs text-cream/60 mt-0.5 font-medium">{event.theme_title}</p>
            </div>
          )}
          <h3 className="font-display text-2xl sm:text-3xl font-semibold text-cream leading-tight mb-3">
            {event.title}
          </h3>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-xs text-cream/50">
              <Calendar size={11} />
              <span>{formattedDate} · {formattedTime}pm</span>
            </div>
            {event.venue_name && (
              <div className="flex items-center gap-1.5 text-xs text-cream/50">
                <MapPin size={11} />
                <span>{event.venue_name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
