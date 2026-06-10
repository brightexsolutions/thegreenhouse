import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { EventTabBar } from "@/components/admin/event-tab-bar";
import type { EventStatus } from "@/types/database";

type Props = { params: Promise<{ id: string }>; children: React.ReactNode };

export default async function EventDetailLayout({ params, children }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title, status, slug")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!event) notFound();

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Event header */}
      <div className="flex items-center justify-between mb-0 pb-4 border-b border-mist flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <p className="text-[10px] text-charcoal/40 uppercase tracking-wider mb-0.5">Event</p>
            <h1 className="text-lg font-semibold text-charcoal truncate">{event.title}</h1>
          </div>
          <StatusBadge status={event.status as EventStatus} />
        </div>
        <Link
          href={`/events/${event.slug}`}
          target="_blank"
          className="text-xs text-charcoal/40 hover:text-forest transition-colors flex-shrink-0"
        >
          ↗ View public
        </Link>
      </div>

      {/* Tab bar */}
      <EventTabBar eventId={id} />

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto pt-5">
        {children}
      </div>
    </div>
  );
}
