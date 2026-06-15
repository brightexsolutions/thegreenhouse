"use client";

import { useRef, useState, useMemo } from "react";
import { Mail, Phone, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ChannelFilter = "all" | "email" | "whatsapp";
type StatusFilter  = "all" | "sent" | "failed" | "pending";

const PAGE_SIZE = 20;

interface LogEntry {
  id:         string;
  channel:    string;
  recipient:  string;
  subject:    string | null;
  status:     string;
  sent_at:    string | null;
  created_at: string;
  events:     { title: string } | null;
}

interface Props {
  logs: LogEntry[];
}

const STATUS_META: Record<string, { icon: typeof CheckCircle2; cls: string; label: string }> = {
  sent:    { icon: CheckCircle2, cls: "text-green-600",    label: "Sent"    },
  failed:  { icon: XCircle,     cls: "text-red-500",      label: "Failed"  },
  pending: { icon: Clock,       cls: "text-charcoal/40",  label: "Pending" },
};

export function CommsLogTable({ logs }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled,       setScrolled]       = useState(false);
  const [channelFilter,  setChannelFilter]  = useState<ChannelFilter>("all");
  const [statusFilter,   setStatusFilter]   = useState<StatusFilter>("all");
  const [eventFilter,    setEventFilter]    = useState("all");
  const [page,           setPage]           = useState(1);

  function handleScroll() {
    setScrolled((scrollRef.current?.scrollTop ?? 0) > 0);
  }

  function resetPage() { setPage(1); scrollRef.current?.scrollTo(0, 0); }

  const filtered = useMemo(() => logs.filter(l => {
    if (channelFilter === "email"    && l.channel !== "email")    return false;
    if (channelFilter === "whatsapp" && l.channel !== "whatsapp") return false;
    if (statusFilter  !== "all"      && l.status  !== statusFilter) return false;
    if (eventFilter   !== "all"      && l.events?.title !== eventFilter) return false;
    return true;
  }), [logs, channelFilter, statusFilter, eventFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = useMemo(() => ({
    all:       logs.length,
    sent:      logs.filter(l => l.status === "sent").length,
    failed:    logs.filter(l => l.status === "failed").length,
    email:     logs.filter(l => l.channel === "email").length,
    whatsapp:  logs.filter(l => l.channel === "whatsapp").length,
  }), [logs]);

  const uniqueEventTitles = useMemo(() =>
    Array.from(new Set(logs.map(l => l.events?.title).filter(Boolean) as string[])),
    [logs]
  );

  return (
    <div className="bg-white rounded-2xl border border-mist overflow-hidden flex flex-col" style={{ maxHeight: "calc(100vh - 260px)" }}>

      {/* ── Filter bar ── */}
      <div className="flex-shrink-0 px-4 pt-3.5 pb-0 border-b border-mist space-y-0">

        {/* Row 1: channel + status chips */}
        <div className="flex items-center justify-between gap-3 pb-3">
          <div className="flex items-center gap-1">
            {([
              { key: "all",      label: "All",       count: counts.all     },
              { key: "email",    label: "Email",     count: counts.email    },
              { key: "whatsapp", label: "WhatsApp",  count: counts.whatsapp },
            ] as { key: ChannelFilter; label: string; count: number }[]).map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => { setChannelFilter(key); resetPage(); }}
                className={cn(
                  "relative px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap",
                  channelFilter === key
                    ? "text-forest bg-forest/8"
                    : "text-charcoal/45 hover:text-charcoal/70 hover:bg-charcoal/4"
                )}
              >
                {label}
                <span className={cn("ml-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full",
                  channelFilter === key ? "bg-forest/12 text-forest" : "bg-charcoal/6 text-charcoal/35"
                )}>{count}</span>
                {channelFilter === key && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-forest rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value as StatusFilter); resetPage(); }}
              className="text-xs border border-mist rounded-lg px-2.5 py-1.5 text-charcoal/60 bg-white focus:outline-none focus:ring-1 focus:ring-forest/30"
            >
              <option value="all">All statuses</option>
              <option value="sent">Sent ({counts.sent})</option>
              <option value="failed">Failed ({counts.failed})</option>
              <option value="pending">Pending</option>
            </select>

            {/* Event filter */}
            {uniqueEventTitles.length > 0 && (
              <select
                value={eventFilter}
                onChange={e => { setEventFilter(e.target.value); resetPage(); }}
                className="text-xs border border-mist rounded-lg px-2.5 py-1.5 text-charcoal/60 bg-white focus:outline-none focus:ring-1 focus:ring-forest/30 max-w-[160px] truncate"
              >
                <option value="all">All events</option>
                {uniqueEventTitles.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* ── Scrollable table ── */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
        <table className="w-full">
          <thead className={cn(
            "sticky top-0 bg-white transition-shadow duration-150",
            scrolled
              ? "shadow-[0_1px_0_0_#e5e7eb,0_2px_8px_0_rgba(0,0,0,0.06)]"
              : "border-b border-mist"
          )}>
            <tr>
              <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-charcoal/40 px-5 py-3">Channel</th>
              <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-charcoal/40 px-4 py-3">Recipient / Subject</th>
              <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-charcoal/40 px-4 py-3 hidden md:table-cell">Event</th>
              <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-charcoal/40 px-4 py-3">Status</th>
              <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-charcoal/40 px-4 py-3 hidden sm:table-cell">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-mist">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-14 text-center text-sm text-charcoal/30">
                  No messages match the current filters
                </td>
              </tr>
            ) : pageRows.map((log) => {
              const meta      = STATUS_META[log.status] ?? STATUS_META.pending;
              const StatusIcon = meta.icon;
              return (
                <tr key={log.id} className="hover:bg-off-white transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="w-7 h-7 rounded-lg bg-forest/8 flex items-center justify-center">
                      {log.channel === "email"
                        ? <Mail    size={12} className="text-forest" />
                        : <Phone   size={12} className="text-forest" />
                      }
                    </div>
                  </td>
                  <td className="px-4 py-3.5 max-w-[220px]">
                    <p className="text-sm text-charcoal font-medium truncate" title={log.subject ?? undefined}>
                      {log.subject ?? "—"}
                    </p>
                    <p className="text-[10px] text-charcoal/40 truncate mt-0.5">{log.recipient}</p>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <p className="text-xs text-charcoal/55 truncate max-w-[160px]">
                      {log.events?.title ?? "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className={cn("flex items-center gap-1.5", meta.cls)}>
                      <StatusIcon size={13} />
                      <span className="text-[11px] font-medium">{meta.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <p className="text-[10px] text-charcoal/40 whitespace-nowrap">
                      {log.sent_at
                        ? new Date(log.sent_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "2-digit" })
                        : "—"}
                    </p>
                    <p className="text-[9px] text-charcoal/25 mt-0.5">
                      {log.sent_at
                        ? new Date(log.sent_at).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: true })
                        : ""}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 border-t border-mist px-5 py-3 flex items-center justify-between">
          <p className="text-[11px] text-charcoal/40">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} &nbsp;·&nbsp; page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); scrollRef.current?.scrollTo(0, 0); }}
              disabled={page === 1}
              className="w-7 h-7 rounded-lg border border-mist flex items-center justify-center text-charcoal/40 hover:text-charcoal hover:border-charcoal/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); scrollRef.current?.scrollTo(0, 0); }}
              disabled={page === totalPages}
              className="w-7 h-7 rounded-lg border border-mist flex items-center justify-center text-charcoal/40 hover:text-charcoal hover:border-charcoal/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
