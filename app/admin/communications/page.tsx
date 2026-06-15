import { createAdminClient } from "@/lib/supabase/server";
import { CommsSendDialog } from "@/components/admin/comms-send-dialog";
import { CommsLogTable } from "@/components/admin/comms-log-table";

export const dynamic = "force-dynamic";

export default async function AdminCommsPage() {
  const supabase = createAdminClient();

  const [{ data: events }, { data: logs }] = await Promise.all([
    supabase.from("events").select("id, title").in("status", ["published", "live", "past"]).is("deleted_at", null).order("event_date", { ascending: false }),
    supabase
      .from("communications_log")
      .select("id, channel, recipient, subject, status, sent_at, created_at, events(title)")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const eventList = (events as Array<{ id: string; title: string }>) ?? [];
  const logList   = (logs  as unknown as Array<{
    id:         string;
    channel:    string;
    recipient:  string;
    subject:    string | null;
    status:     string;
    sent_at:    string | null;
    created_at: string;
    events:     { title: string } | null;
  }>) ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-charcoal">Communications</h1>
          <p className="text-sm text-charcoal/40 mt-0.5">Send broadcasts and view message history</p>
        </div>
        <CommsSendDialog events={eventList} />
      </div>

      <CommsLogTable logs={logList} />
    </div>
  );
}
