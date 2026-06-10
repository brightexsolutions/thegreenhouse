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

  // 1 event — centred, comfortable width
  if (events.length === 1) {
    return (
      <FadeIn>
        <div className="max-w-sm">
          <EventCard event={events[0]} featured />
        </div>
      </FadeIn>
    );
  }

  // 2 events — side by side, equal size
  if (events.length === 2) {
    return (
      <div className="grid sm:grid-cols-2 gap-5 max-w-2xl">
        {events.map((event, i) => (
          <FadeIn key={event.id} delay={i * 0.07}>
            <EventCard event={event} featured />
          </FadeIn>
        ))}
      </div>
    );
  }

  // 3+ events — featured left, grid right
  const [featured, ...rest] = events;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <FadeIn className="md:row-span-2 lg:col-span-1">
          <EventCard event={featured} featured />
        </FadeIn>
        {rest.slice(0, 4).map((event, i) => (
          <FadeIn key={event.id} delay={0.05 * (i + 1)}>
            <EventCard event={event} />
          </FadeIn>
        ))}
      </div>
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
