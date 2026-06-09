"use client";

import { EventCard } from "./event-card";
import { FadeIn } from "@/components/motion/fade-in";
import type { Event } from "@/types/database";

interface EventGridProps {
  events: Event[];
}

export function EventGrid({ events }: EventGridProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-full border-2 border-mist flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🌿</span>
        </div>
        <p className="text-charcoal/40 text-sm">No sessions yet. Check back soon.</p>
      </div>
    );
  }

  const [featured, ...rest] = events;

  return (
    <div className="space-y-6">
      {/* Featured + side cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Featured — spans more height on larger screens */}
        <FadeIn className="md:row-span-2 lg:col-span-1">
          <EventCard event={featured} featured />
        </FadeIn>

        {rest.slice(0, 4).map((event, i) => (
          <FadeIn key={event.id} delay={0.05 * (i + 1)}>
            <EventCard event={event} />
          </FadeIn>
        ))}
      </div>

      {/* Remaining events — standard 3-col grid */}
      {rest.length > 4 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rest.slice(4).map((event, i) => (
            <FadeIn key={event.id} delay={0.05 * i}>
              <EventCard event={event} />
            </FadeIn>
          ))}
        </div>
      )}
    </div>
  );
}
