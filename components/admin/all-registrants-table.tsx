"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Search, Mail, Phone, CheckCircle2, Circle, Users, Send, Copy, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Registrant {
  id:              string;
  first_name:      string;
  last_name:       string;
  email:           string | null;
  phone:           string | null;
  role:            string;
  source:          string | null;
  ticket_sent:     boolean;
  checked_in:      boolean;
  whatsapp_opt_in: boolean;
  created_at:      string;
  event_id:        string;
  ticket_token:    string;
  events:          { id: string; title: string; slug?: string } | null;
}

interface Props {
  registrants: Registrant[];
  events:      Array<{ id: string; title: string }>;
}

const ROLE_LABELS: Record<string, string> = {
  guest:           "Guest",
  curious:         "Curious",
  vision_carrier:  "Vision Carrier",
  vocalist:        "Vocalist",
  instrumentalist: "Instrumentalist",
};

const PAGE_SIZE = 20;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thegreenhousekws.co.ke";

export function AllRegistrantsTable({ registrants: initialRegistrants, events }: Props) {
  const router   = useRouter();
  const [query,       setQuery]      = useState("");
  const [eventId,     setEventId]    = useState("all");
  const [attended,    setAttended]   = useState<"all" | "present" | "absent">("all");
  const [page,        setPage]       = useState(1);
  const [registrants, setRegistrants] = useState(initialRegistrants);
  const [resending,   setResending]  = useState<string | null>(null);
  const [resendMsg,   setResendMsg]  = useState<{ id: string; ok: boolean; text: string } | null>(null);
  const [copied,      setCopied]     = useState<string | null>(null);
  const [spinning,    setSpinning]   = useState(false);
  const supabaseRef = useRef(createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel("admin-registrants-rt")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "registrations",
      }, (payload) => {
        const r = payload.new as Registrant & { events: null };
        const matchedEvent = events.find(e => e.id === r.event_id);
        setRegistrants(prev => [{ ...r, events: matchedEvent ?? null }, ...prev]);
      })
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "registrations",
      }, (payload) => {
        const updated = payload.new as Registrant;
        setRegistrants(prev =>
          prev.map(r => r.id === updated.id ? { ...r, checked_in: updated.checked_in, ticket_sent: updated.ticket_sent } : r)
        );
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [events]);

  function refresh() {
    setSpinning(true);
    router.refresh();
    setTimeout(() => setSpinning(false), 800);
  }

  async function resendTicket(registrantId: string) {
    setResending(registrantId);
    const res = await fetch(`/api/admin/registrations/${registrantId}/resend-ticket`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setResendMsg({
      id:   registrantId,
      ok:   res.ok,
      text: res.ok ? "Ticket resent" : (data.error ?? "Failed to resend"),
    });
    setResending(null);
    setTimeout(() => setResendMsg(null), 3000);
  }

  function copyTicketLink(token: string, regId: string) {
    const url = `${SITE_URL}/ticket/${token}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(regId);
    setTimeout(() => setCopied(null), 2000);
  }

  function buildWaLink(r: Registrant) {
    if (!r.ticket_token) return null;
    const url        = `${SITE_URL}/ticket/${r.ticket_token}`;
    const eventTitle = r.events?.title?.replace("The Green House — ", "") ?? "the session";
    const text = `Hi ${r.first_name}, here is your ticket for ${eventTitle}:\n${url}\nPresent this at the door. See you there!`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  const filtered = useMemo(() => {
    return registrants.filter(r => {
      const q = query.toLowerCase();
      const matchQ = !q || `${r.first_name} ${r.last_name} ${r.email ?? ""} ${r.phone ?? ""}`.toLowerCase().includes(q);
      const matchE = eventId === "all" || r.event_id === eventId;
      const matchA =
        attended === "all" ||
        (attended === "present" && r.checked_in) ||
        (attended === "absent" && !r.checked_in);
      return matchQ && matchE && matchA;
    });
  }, [registrants, query, eventId, attended]);

  const pages    = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const slice    = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function reset() { setPage(1); }

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); reset(); }}
            placeholder="Search name, email, phone…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-mist bg-white text-sm placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40 transition-all"
          />
        </div>

        {events.length > 1 && (
          <select
            value={eventId}
            onChange={e => { setEventId(e.target.value); reset(); }}
            className="px-3 py-2 rounded-xl border border-mist bg-white text-sm text-charcoal focus:outline-none focus:border-forest transition-colors"
          >
            <option value="all">All sessions</option>
            {events.map(e => (
              <option key={e.id} value={e.id}>
                {e.title.replace("The Green House — ", "")}
              </option>
            ))}
          </select>
        )}

        <div className="flex items-center gap-1 bg-white rounded-xl border border-mist p-1 flex-shrink-0">
          {(["all", "present", "absent"] as const).map(f => (
            <button
              key={f}
              onClick={() => { setAttended(f); reset(); }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                attended === f ? "bg-forest text-cream" : "text-charcoal/50 hover:text-charcoal hover:bg-charcoal/5"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <button
          onClick={refresh}
          title="Refresh"
          className="flex-shrink-0 p-2 rounded-xl border border-mist bg-white text-charcoal/40 hover:text-forest hover:border-forest/30 transition-all"
        >
          <RefreshCw size={14} className={cn("transition-transform", spinning && "animate-spin")} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-mist overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-charcoal/5 flex items-center justify-center mb-3">
              <Users size={20} className="text-charcoal/25" />
            </div>
            <p className="text-sm font-medium text-charcoal/40">No registrants found</p>
            <p className="text-xs text-charcoal/25 mt-1">
              {query || eventId !== "all" || attended !== "all"
                ? "Try adjusting your filters"
                : "Registrations will appear here"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto max-h-[560px]">
              <table className="w-full">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-mist">
                    <th className="text-left text-[9px] font-semibold uppercase tracking-wider text-charcoal/35 px-5 py-3">Person</th>
                    <th className="text-left text-[9px] font-semibold uppercase tracking-wider text-charcoal/35 px-4 py-3 hidden md:table-cell">Session</th>
                    <th className="text-left text-[9px] font-semibold uppercase tracking-wider text-charcoal/35 px-4 py-3 hidden sm:table-cell">Role</th>
                    <th className="text-center text-[9px] font-semibold uppercase tracking-wider text-charcoal/35 px-4 py-3">Ticket</th>
                    <th className="text-center text-[9px] font-semibold uppercase tracking-wider text-charcoal/35 px-4 py-3">Attended</th>
                    <th className="text-right text-[9px] font-semibold uppercase tracking-wider text-charcoal/35 px-5 py-3 hidden lg:table-cell">Registered</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist">
                  {slice.map(r => (
                    <tr key={r.id} className="hover:bg-off-white transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-forest/8 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-forest uppercase">
                              {r.first_name[0]}{r.last_name[0]}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-charcoal truncate">{r.first_name} {r.last_name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {r.email && (
                                <span className="flex items-center gap-1 text-[10px] text-charcoal/40 truncate">
                                  <Mail size={9} /> {r.email}
                                </span>
                              )}
                              {r.phone && (
                                <span className="flex items-center gap-1 text-[10px] text-charcoal/40">
                                  <Phone size={9} /> {r.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {r.events ? (
                          <p className="text-xs text-charcoal/60 truncate max-w-[140px]">
                            {r.events.title.replace("The Green House — ", "")}
                          </p>
                        ) : (
                          <span className="text-[10px] text-charcoal/30">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-[10px] text-charcoal/50 bg-charcoal/5 px-2 py-0.5 rounded-lg">
                          {ROLE_LABELS[r.role] ?? r.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span title={r.ticket_sent ? "Ticket sent" : "Not sent"}>
                          {r.ticket_sent
                            ? <CheckCircle2 size={14} className="text-green-500 mx-auto" />
                            : <Circle size={14} className="text-charcoal/20 mx-auto" />
                          }
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                          r.checked_in ? "bg-green-100 text-green-700" : "bg-charcoal/5 text-charcoal/40"
                        )}>
                          {r.checked_in ? "Present" : "Absent"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right hidden lg:table-cell">
                        <p className="text-[10px] text-charcoal/35">
                          {new Date(r.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "2-digit" })}
                          <span className="block text-charcoal/25 text-[9px] mt-0.5">
                            {new Date(r.created_at).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: true })}
                          </span>
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {r.email && (
                            <button
                              onClick={() => resendTicket(r.id)}
                              disabled={resending === r.id}
                              title="Resend ticket email"
                              className="p-1.5 rounded-lg text-charcoal/30 hover:text-forest hover:bg-forest/8 transition-colors disabled:opacity-40"
                            >
                              {resending === r.id
                                ? <span className="block w-3 h-3 rounded-full border border-forest/30 border-t-forest animate-spin" />
                                : <Send size={12} />
                              }
                            </button>
                          )}
                          {r.ticket_token && (
                            <button
                              onClick={() => copyTicketLink(r.ticket_token, r.id)}
                              title="Copy ticket link"
                              className="p-1.5 rounded-lg text-charcoal/30 hover:text-forest hover:bg-forest/8 transition-colors"
                            >
                              {copied === r.id
                                ? <CheckCircle2 size={12} className="text-green-500" />
                                : <Copy size={12} />
                              }
                            </button>
                          )}
                          {r.ticket_token && (() => {
                            const waLink = buildWaLink(r);
                            return waLink ? (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Share via WhatsApp"
                                className="p-1.5 rounded-lg text-charcoal/30 hover:text-[#25d366] hover:bg-green-50 transition-colors"
                              >
                                <ExternalLink size={12} />
                              </a>
                            ) : null;
                          })()}
                        </div>
                        {resendMsg?.id === r.id && (
                          <p className={`text-[10px] mt-1 text-right ${resendMsg.ok ? "text-green-600" : "text-red-500"}`}>
                            {resendMsg.text}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-mist flex-shrink-0">
              <p className="text-xs text-charcoal/40">
                {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="px-3 py-1.5 rounded-lg text-xs text-charcoal/50 hover:text-charcoal hover:bg-charcoal/5 disabled:opacity-30 transition-all"
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                  const n = safePage <= 4 ? i + 1
                    : safePage >= pages - 3 ? pages - 6 + i
                    : safePage - 3 + i;
                  if (n < 1 || n > pages) return null;
                  return (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={cn(
                        "w-7 h-7 rounded-lg text-xs font-medium transition-all",
                        n === safePage ? "bg-forest text-cream" : "text-charcoal/50 hover:bg-charcoal/5"
                      )}
                    >
                      {n}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={safePage === pages}
                  className="px-3 py-1.5 rounded-lg text-xs text-charcoal/50 hover:text-charcoal hover:bg-charcoal/5 disabled:opacity-30 transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
