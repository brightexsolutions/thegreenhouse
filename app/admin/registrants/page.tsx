import { createAdminClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/ui/page-header";
import { AllRegistrantsTable } from "@/components/admin/all-registrants-table";

export const dynamic = "force-dynamic";

export default async function AdminRegistrantsPage() {
  const supabase = createAdminClient();

  const [{ data: rows }, { data: events }] = await Promise.all([
    supabase
      .from("registrations")
      .select("id, first_name, last_name, email, phone, role, source, ticket_sent, checked_in, whatsapp_opt_in, created_at, event_id, ticket_token")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("events")
      .select("id, title")
      .is("deleted_at", null)
      .order("event_date", { ascending: false }),
  ]);

  const eventList = (events as Array<{ id: string; title: string }>) ?? [];
  const eventMap = new Map(eventList.map(e => [e.id, e]));

  const registrants = ((rows ?? []) as Array<{
    id: string; first_name: string; last_name: string;
    email: string | null; phone: string | null; role: string;
    source: string | null; ticket_sent: boolean; checked_in: boolean;
    whatsapp_opt_in: boolean; created_at: string; event_id: string; ticket_token: string;
  }>).map(r => ({ ...r, events: eventMap.get(r.event_id) ?? null }));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Registrants"
        description={`${registrants.length} total across all sessions`}
      />
      <AllRegistrantsTable registrants={registrants} events={eventList} />
    </div>
  );
}
