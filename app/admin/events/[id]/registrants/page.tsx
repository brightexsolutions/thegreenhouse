import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { AllRegistrantsTable } from "@/components/admin/all-registrants-table";
import { Download } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EventRegistrantsPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title, slug")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!event) notFound();

  const { data: registrants } = await supabase
    .from("registrations")
    .select("id, first_name, last_name, email, phone, role, source, ticket_sent, checked_in, whatsapp_opt_in, created_at, event_id")
    .eq("event_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const list = ((registrants ?? []) as Array<{
    id: string; first_name: string; last_name: string;
    email: string | null; phone: string | null; role: string;
    source: string | null; ticket_sent: boolean; checked_in: boolean;
    whatsapp_opt_in: boolean; created_at: string; event_id: string;
  }>).map(r => ({ ...r, events: { id, title: event.title } }));

  const eventEntry = [{ id, title: event.title }];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between flex-shrink-0">
        <p className="text-sm text-charcoal/50">{list.length} registrant{list.length !== 1 ? "s" : ""}</p>
        <div className="flex items-center gap-2">
          <a
            href={`/api/admin/events/${id}/export?format=csv`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-mist text-xs text-charcoal/60 hover:border-forest/30 hover:text-forest transition-all"
          >
            <Download size={11} /> CSV
          </a>
          <a
            href={`/api/admin/events/${id}/export?format=pdf`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-mist text-xs text-charcoal/60 hover:border-forest/30 hover:text-forest transition-all"
          >
            <Download size={11} /> PDF
          </a>
        </div>
      </div>
      <AllRegistrantsTable registrants={list} events={eventEntry} />
    </div>
  );
}
