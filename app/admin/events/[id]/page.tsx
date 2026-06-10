import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/admin/event-form";

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
    <div className="max-w-2xl">
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
          dress_code:        event.dress_code ?? undefined,
          playlist_url:      event.playlist_url ?? undefined,
          feedback_url:      event.feedback_url ?? undefined,
          cover_image:       event.cover_image ?? undefined,
          slug:              event.slug,
        }}
      />
    </div>
  );
}
