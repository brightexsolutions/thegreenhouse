import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { RegistrantsTable } from "@/components/admin/registrants-table";
import { ArrowLeft, Download } from "lucide-react";

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
    .select("*")
    .eq("event_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const list = (registrants as Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    role: string;
    source: string | null;
    ticket_sent: boolean;
    checked_in: boolean;
    whatsapp_opt_in: boolean;
    created_at: string;
  }>) ?? [];

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/admin/events/${id}`} className="text-charcoal/40 hover:text-charcoal transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-charcoal">Registrants</h1>
            <p className="text-sm text-charcoal/40 mt-0.5">{event.title} — {list.length} registered</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/admin/events/${id}/export?format=csv`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-mist text-xs text-charcoal/60 hover:border-forest/30 hover:text-forest transition-all"
          >
            <Download size={11} /> CSV
          </a>
          <a
            href={`/api/admin/events/${id}/export?format=pdf`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-mist text-xs text-charcoal/60 hover:border-forest/30 hover:text-forest transition-all"
          >
            <Download size={11} /> PDF
          </a>
        </div>
      </div>

      <RegistrantsTable registrants={list} eventId={id} />
    </div>
  );
}
