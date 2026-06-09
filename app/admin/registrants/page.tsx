import { createAdminClient } from "@/lib/supabase/server";
import { RegistrantsTable } from "@/components/admin/registrants-table";

export const dynamic = "force-dynamic";

export default async function AdminRegistrantsPage() {
  const supabase = createAdminClient();
  const { data: rows } = await supabase
    .from("registrations")
    .select("*, events(title)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  const registrants = (rows as Array<{
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
    event_id: string;
    events: { title: string } | null;
  }>) ?? [];

  const total = registrants.length;

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold text-charcoal">All Registrants</h1>
        <p className="text-sm text-charcoal/40 mt-0.5">{total} across all sessions</p>
      </div>
      <RegistrantsTable registrants={registrants} eventId="" />
    </div>
  );
}
