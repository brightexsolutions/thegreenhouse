"use client";

import { useState } from "react";
import { Search, Mail, Phone, CheckCircle2, Circle, Share2, Loader2, Send } from "lucide-react";
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
}

interface RegistrantsTableProps {
  registrants: Registrant[];
  eventId:     string;
}

const ROLE_LABELS: Record<string, string> = {
  guest:          "Guest",
  curious:        "Curious",
  vision_carrier: "Vision Carrier",
  vocalist:       "Vocalist",
  instrumentalist:"Instrumentalist",
};

export function RegistrantsTable({ registrants, eventId }: RegistrantsTableProps) {
  const [query,        setQuery]        = useState("");
  const [filter,       setFilter]       = useState<"all" | "present" | "absent">("all");
  const [shareEmail,   setShareEmail]   = useState("");
  const [sharing,      setSharing]      = useState(false);
  const [shareMsg,     setShareMsg]     = useState<string | null>(null);
  const [resending,    setResending]    = useState<Record<string, boolean>>({});
  const [resendStatus, setResendStatus] = useState<Record<string, "ok" | "err">>({});

  const filtered = registrants.filter((r) => {
    const matchesQuery =
      `${r.first_name} ${r.last_name} ${r.email ?? ""} ${r.phone ?? ""}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "present" && r.checked_in) ||
      (filter === "absent" && !r.checked_in);
    return matchesQuery && matchesFilter;
  });

  async function handleResend(registrantId: string) {
    setResending(prev => ({ ...prev, [registrantId]: true }));
    setResendStatus(prev => { const n = { ...prev }; delete n[registrantId]; return n; });
    try {
      const res = await fetch(`/api/admin/registrations/${registrantId}/resend-ticket`, { method: "POST" });
      setResendStatus(prev => ({ ...prev, [registrantId]: res.ok ? "ok" : "err" }));
      setTimeout(() => setResendStatus(prev => { const n = { ...prev }; delete n[registrantId]; return n; }), 3000);
    } finally {
      setResending(prev => ({ ...prev, [registrantId]: false }));
    }
  }

  async function handleShare() {
    if (!shareEmail.trim()) return;
    setSharing(true);
    setShareMsg(null);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/share-list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: shareEmail }),
      });
      if (res.ok) {
        setShareMsg("List sent successfully");
        setShareEmail("");
      } else {
        setShareMsg("Failed to send. Try again.");
      }
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, phone…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-mist bg-white text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 bg-white rounded-xl border border-mist p-1">
          {(["all", "present", "absent"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                filter === f ? "bg-forest text-cream" : "text-charcoal/50 hover:text-charcoal"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Share bar */}
      <div className="flex items-center gap-2 bg-white rounded-xl border border-mist p-3">
        <Share2 size={12} className="text-charcoal/30 flex-shrink-0" />
        <input
          value={shareEmail}
          onChange={(e) => setShareEmail(e.target.value)}
          placeholder="Share list via email…"
          type="email"
          className="flex-1 text-xs bg-transparent outline-none text-charcoal placeholder:text-charcoal/30"
        />
        <button
          onClick={handleShare}
          disabled={sharing || !shareEmail.trim()}
          className="flex items-center gap-1 text-xs text-forest font-semibold hover:underline disabled:opacity-40"
        >
          {sharing ? <Loader2 size={11} className="animate-spin" /> : "Send"}
        </button>
        {shareMsg && <span className="text-[10px] text-charcoal/40">{shareMsg}</span>}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-mist overflow-hidden">
        <div className="px-5 py-3 border-b border-mist flex items-center justify-between">
          <span className="text-xs text-charcoal/40">{filtered.length} of {registrants.length} registrants</span>
        </div>
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-charcoal/30">No results</div>
        ) : (
          <div className="divide-y divide-mist">
            {filtered.map((r) => (
              <div key={r.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-off-white transition-colors">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-forest/8 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-forest">
                    {r.first_name[0]}{r.last_name[0]}
                  </span>
                </div>

                {/* Name + contact */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charcoal">
                    {r.first_name} {r.last_name}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {r.email && (
                      <span className="flex items-center gap-1 text-[10px] text-charcoal/40">
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

                {/* Role */}
                <span className="hidden sm:block text-[10px] text-charcoal/40 bg-charcoal/5 px-2 py-1 rounded-lg flex-shrink-0">
                  {ROLE_LABELS[r.role] ?? r.role}
                </span>

                {/* Ticket sent + resend */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className={cn(r.ticket_sent ? "text-green-500" : "text-charcoal/20")} title={r.ticket_sent ? "Ticket sent" : "Not sent"}>
                    {r.ticket_sent ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                  </div>
                  {r.email && (
                    <button
                      onClick={() => handleResend(r.id)}
                      disabled={resending[r.id]}
                      title={resendStatus[r.id] === "ok" ? "Sent!" : resendStatus[r.id] === "err" ? "Failed" : "Resend ticket"}
                      className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center transition-colors",
                        resendStatus[r.id] === "ok"  ? "bg-green-100 text-green-600" :
                        resendStatus[r.id] === "err" ? "bg-red-100 text-red-500" :
                        "bg-charcoal/5 hover:bg-forest/10 text-charcoal/35 hover:text-forest"
                      )}
                    >
                      {resending[r.id]
                        ? <Loader2 size={10} className="animate-spin" />
                        : <Send size={10} />
                      }
                    </button>
                  )}
                </div>

                {/* Checked in */}
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0",
                  r.checked_in ? "bg-green-100 text-green-700" : "bg-charcoal/5 text-charcoal/40"
                )}>
                  {r.checked_in ? "Present" : "Absent"}
                </span>

                {/* Date */}
                <p className="text-[10px] text-charcoal/30 flex-shrink-0 hidden md:block">
                  {new Date(r.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
