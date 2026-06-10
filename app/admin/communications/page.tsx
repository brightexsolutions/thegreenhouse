import { createAdminClient } from "@/lib/supabase/server";
import { CommsSendDialog } from "@/components/admin/comms-send-dialog";
import { Mail, Phone, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type IconComp = typeof CheckCircle2;
const STATUS_STYLES: Record<string, { icon: IconComp; cls: string }> = {
  sent:    { icon: CheckCircle2, cls: "text-green-600" },
  failed:  { icon: XCircle,     cls: "text-red-500" },
  pending: { icon: Clock,       cls: "text-charcoal/40" },
};

export default async function AdminCommsPage() {
  const supabase = createAdminClient();

  const [{ data: events }, { data: logs }] = await Promise.all([
    supabase.from("events").select("id, title").in("status", ["published", "live"]).is("deleted_at", null),
    supabase
      .from("communications_log")
      .select("*, events(title)")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const eventList = (events as Array<{ id: string; title: string }>) ?? [];
  const logList   = (logs as Array<{
    id: string;
    channel: string;
    recipient: string;
    subject: string | null;
    status: string;
    sent_at: string | null;
    created_at: string;
    events: { title: string } | null;
  }>) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-charcoal">Communications</h1>
          <p className="text-sm text-charcoal/40 mt-0.5">Send broadcasts and view message history</p>
        </div>
        <CommsSendDialog events={eventList} />
      </div>

      {/* Log */}
      <div className="bg-white rounded-2xl border border-mist overflow-hidden">
        <div className="px-6 py-4 border-b border-mist">
          <h2 className="text-sm font-semibold text-charcoal">Message log</h2>
        </div>
        {logList.length === 0 ? (
          <div className="py-12 text-center text-sm text-charcoal/30">No messages sent yet</div>
        ) : (
          <div className="divide-y divide-mist">
            {logList.map((log) => {
              const StatusIcon = STATUS_STYLES[log.status]?.icon ?? Clock;
              const statusCls  = STATUS_STYLES[log.status]?.cls ?? "text-charcoal/40";
              return (
                <div key={log.id} className="px-6 py-4 flex items-center gap-4 hover:bg-off-white transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-forest/8 flex items-center justify-center flex-shrink-0">
                    {log.channel === "email" ? <Mail size={13} className="text-forest" /> : <Phone size={13} className="text-forest" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-charcoal font-medium truncate">
                      {log.subject ?? log.recipient}
                    </p>
                    <p className="text-[10px] text-charcoal/40 mt-0.5 truncate">
                      {log.recipient} {log.events ? `· ${log.events.title}` : ""}
                    </p>
                  </div>
                  <div className={cn("flex items-center gap-1 flex-shrink-0", statusCls)}>
                    <StatusIcon size={13} />
                    <span className="text-[10px] capitalize">{log.status}</span>
                  </div>
                  <p className="text-[10px] text-charcoal/30 flex-shrink-0 hidden sm:block">
                    {log.sent_at
                      ? new Date(log.sent_at).toLocaleDateString("en-KE", { day: "numeric", month: "short" })
                      : "—"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
