import { createAdminClient } from "@/lib/supabase/server";
import { CheckCircle2, XCircle, AlertTriangle, Info, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

type LogRow = {
  id: string;
  channel: string;
  recipient: string;
  subject: string | null;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  events: { title: string } | null;
};

async function getLogs() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("communications_log")
    .select("id, channel, recipient, subject, status, error_message, sent_at, created_at, events(title)")
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []) as unknown as LogRow[];
}

const STATUS = {
  sent:    { icon: CheckCircle2, cls: "text-green-600" },
  failed:  { icon: XCircle,      cls: "text-red-500"   },
  pending: { icon: AlertTriangle, cls: "text-yellow-500" },
} as const;

export default async function LogsPage() {
  const logs = await getLogs();

  const sentCount    = logs.filter(l => l.status === "sent").length;
  const failedCount  = logs.filter(l => l.status === "failed").length;
  const pendingCount = logs.filter(l => l.status === "pending").length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-forest">System Logs</h1>
        <p className="text-sm text-charcoal/50 mt-1">Communications history — last 200 entries</p>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3 mb-6">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-green-50 text-green-700">
          <CheckCircle2 size={12} /> {sentCount} sent
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-red-50 text-red-600">
          <XCircle size={12} /> {failedCount} failed
        </span>
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-yellow-50 text-yellow-600">
            <AlertTriangle size={12} /> {pendingCount} pending
          </span>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-mist p-12 text-center">
          <Info size={24} className="mx-auto text-charcoal/20 mb-3" />
          <p className="text-sm text-charcoal/50">No log entries yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-mist overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mist bg-off-white">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal/50 uppercase tracking-wider w-8" />
                  <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal/50 uppercase tracking-wider">Channel</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal/50 uppercase tracking-wider">Recipient</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal/50 uppercase tracking-wider">Event</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal/50 uppercase tracking-wider">Subject / Message</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal/50 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist/60">
                {logs.map(log => {
                  const statusKey = (log.status in STATUS ? log.status : "pending") as keyof typeof STATUS;
                  const { icon: Icon, cls } = STATUS[statusKey];
                  return (
                    <tr key={log.id} className="hover:bg-off-white/50 transition-colors">
                      <td className="px-4 py-3">
                        <Icon size={14} className={cls} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          log.channel === "email"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-green-50 text-green-700"
                        }`}>
                          {log.channel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-charcoal/70 font-mono text-xs max-w-[160px] truncate">
                        {log.recipient}
                      </td>
                      <td className="px-4 py-3 text-charcoal/60 text-xs max-w-[140px] truncate">
                        {(log.events as { title: string } | null)?.title ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-charcoal/60 text-xs max-w-[200px] truncate">
                        {log.error_message
                          ? <span className="text-red-500">{log.error_message}</span>
                          : (log.subject ?? "—")
                        }
                      </td>
                      <td className="px-4 py-3 text-charcoal/40 text-xs whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(log.created_at).toLocaleString("en-KE", { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
