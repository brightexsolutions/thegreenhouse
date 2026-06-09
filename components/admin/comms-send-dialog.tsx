"use client";

import { useState } from "react";
import { Send, X, Loader2 } from "lucide-react";

interface CommsDialogProps {
  events: Array<{ id: string; title: string }>;
}

export function CommsSendDialog({ events }: CommsDialogProps) {
  const [open,       setOpen]       = useState(false);
  const [eventId,    setEventId]    = useState(events[0]?.id ?? "");
  const [channel,    setChannel]    = useState<"email" | "whatsapp">("email");
  const [scope,      setScope]      = useState<"all" | "opt_in">("all");
  const [subject,    setSubject]    = useState("");
  const [message,    setMessage]    = useState("");
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState<string | null>(null);

  async function handleSend() {
    if (!eventId || !message) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/communications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, channel, scope, subject, message }),
      });
      const data = await res.json();
      setResult(res.ok ? `Sent to ${data.count} recipients` : (data.error ?? "Failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-forest text-cream text-sm font-semibold hover:bg-moss transition-colors"
      >
        <Send size={13} /> Send broadcast
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md bg-cream rounded-3xl shadow-2xl z-10 overflow-hidden">
            <div className="px-6 pt-6 pb-5 border-b border-mist flex items-center justify-between">
              <h2 className="text-base font-semibold text-charcoal">Send Broadcast</h2>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full border border-mist flex items-center justify-center text-charcoal/40 hover:text-charcoal">
                <X size={14} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Event */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-charcoal/70">Event</label>
                <select value={eventId} onChange={(e) => setEventId(e.target.value)} className={sel}>
                  {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                </select>
              </div>

              {/* Channel + scope */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-charcoal/70">Channel</label>
                  <select value={channel} onChange={(e) => setChannel(e.target.value as "email" | "whatsapp")} className={sel}>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-charcoal/70">Send to</label>
                  <select value={scope} onChange={(e) => setScope(e.target.value as "all" | "opt_in")} className={sel}>
                    <option value="all">All registrants</option>
                    <option value="opt_in">WhatsApp opt-in only</option>
                  </select>
                </div>
              </div>

              {/* Subject (email only) */}
              {channel === "email" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-charcoal/70">Subject</label>
                  <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="A note from The Green House" className={inp} />
                </div>
              )}

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-charcoal/70">Message</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Write your message here…" className={`${inp} resize-none`} />
              </div>

              {result && <p className="text-xs text-center text-charcoal/50">{result}</p>}

              <button
                onClick={handleSend}
                disabled={loading || !message}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-forest text-cream text-sm font-semibold hover:bg-moss transition-all disabled:opacity-60"
              >
                {loading ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : "Send message"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const sel = "w-full px-3 py-2.5 rounded-xl border border-mist bg-off-white text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest/20";
const inp = "w-full px-4 py-2.5 rounded-xl border border-mist bg-off-white text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/20";
