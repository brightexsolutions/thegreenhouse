import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/admin/event-form";
import { CheckinLinkPanel } from "@/components/admin/checkin-link-panel";
import { QrSharePanel } from "@/components/admin/qr-share-panel";
import { Users, Music } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditEventPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!event) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-charcoal">{event.title}</h1>
          <p className="text-sm text-charcoal/40 mt-0.5">Edit event details</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/events/${id}/sessions`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-mist text-xs text-charcoal/60 hover:border-forest/30 hover:text-forest transition-all"
          >
            <Music size={12} /> Sessions
          </Link>
          <Link
            href={`/admin/events/${id}/registrants`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-mist text-xs text-charcoal/60 hover:border-forest/30 hover:text-forest transition-all"
          >
            <Users size={12} /> Registrants
          </Link>
        </div>
      </div>

      <EventForm
        eventId={id}
        defaultValues={{
          title:             event.title,
          subtitle:          event.subtitle ?? undefined,
          event_date:        event.event_date,
          event_time:        event.event_time.slice(0, 5),
          venue_name:        event.venue_name ?? undefined,
          venue_address:     event.venue_address ?? undefined,
          venue_map_url:     event.venue_map_url ?? undefined,
          type:              event.type,
          price_kes:         event.price_kes ?? undefined,
          capacity:          event.capacity ?? undefined,
          status:            event.status,
          description:       event.description ?? undefined,
          theme_title:       event.theme_title ?? undefined,
          theme_scripture:   event.theme_scripture ?? undefined,
          theme_description: event.theme_description ?? undefined,
          playlist_url:      event.playlist_url ?? undefined,
          feedback_url:      event.feedback_url ?? undefined,
          cover_image:       event.cover_image ?? undefined,
          slug:              event.slug,
        }}
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <CheckinLinkPanel eventId={id} eventSlug={event.slug} checkinToken={event.checkin_token} />
        <QrSharePanel eventId={id} eventSlug={event.slug} />
      </div>
    </div>
  );
}
