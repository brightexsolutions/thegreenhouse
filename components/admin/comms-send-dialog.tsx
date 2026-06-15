"use client";

import { useState } from "react";
import { Send, X, Loader2, Mail, Phone, Users, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommsDialogProps {
  events: Array<{ id: string; title: string }>;
}

export function CommsSendDialog({ events }: CommsDialogProps) {
  const [open,    setOpen]    = useState(false);
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");
  const [scope,   setScope]   = useState<"all" | "opt_in">("all");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<{ ok: boolean; text: string } | null>(null);

  function close() { setOpen(false); setResult(null); }

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
      if (res.ok) {
        setResult({ ok: true, text: `Sent to ${data.count} recipient${data.count !== 1 ? "s" : ""}` });
        setMessage(""); setSubject("");
      } else {
        setResult({ ok: false, text: data.error ?? "Something went wrong" });
      }
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-md bg-cream rounded-3xl shadow-2xl z-10 overflow-hidden">

            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-mist flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-charcoal leading-tight">Send Broadcast</h2>
                <p className="text-[11px] text-charcoal/40 mt-0.5">Message will be sent to all matched registrants</p>
              </div>
              <button onClick={close} className="w-8 h-8 rounded-full border border-mist flex items-center justify-center text-charcoal/40 hover:text-charcoal transition-colors">
                <X size={14} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">

              {/* Event */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-charcoal/50 uppercase tracking-wider">Event</label>
                <div className="relative">
                  <select
                    value={eventId}
                    onChange={e => setEventId(e.target.value)}
                    className="w-full appearance-none px-3.5 py-2.5 pr-8 rounded-xl border border-mist bg-white text-sm text-charcoal focus:outline-none focus:border-forest/50 focus:ring-2 focus:ring-forest/10 transition-all"
                  >
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.title}</option>
                    ))}
                  </select>
                  <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/35" width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {/* Channel toggle */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-charcoal/50 uppercase tracking-wider">Channel</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "email",    Icon: Mail,  label: "Email"    },
                    { value: "whatsapp", Icon: Phone, label: "WhatsApp" },
                  ] as const).map(({ value, Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => setChannel(value)}
                      className={cn(
                        "flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all",
                        channel === value
                          ? "border-forest bg-forest text-cream shadow-sm"
                          : "border-mist bg-white text-charcoal/55 hover:border-forest/30 hover:text-charcoal"
                      )}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Send to toggle */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-charcoal/50 uppercase tracking-wider">Send to</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "all",     Icon: Users,  label: "All registrants" },
                    { value: "opt_in",  Icon: Heart,  label: "Opted-in only"   },
                  ] as const).map(({ value, Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => setScope(value)}
                      className={cn(
                        "flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all",
                        scope === value
                          ? "border-forest bg-forest text-cream shadow-sm"
                          : "border-mist bg-white text-charcoal/55 hover:border-forest/30 hover:text-charcoal"
                      )}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  ))}
                </div>
                {scope === "opt_in" && (
                  <p className="text-[10px] text-charcoal/35 leading-relaxed">
                    Only sends to registrants who ticked &ldquo;Keep me updated&rdquo; at registration.
                  </p>
                )}
              </div>

              {/* Subject (email only) */}
              {channel === "email" && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-charcoal/50 uppercase tracking-wider">Subject</label>
                  <input
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="A note from The Green House"
                    className={inp}
                  />
                </div>
              )}

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-charcoal/50 uppercase tracking-wider">Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Write your message here…"
                  className={`${inp} resize-none`}
                />
              </div>

              {/* Result */}
              {result && (
                <div className={cn(
                  "px-4 py-2.5 rounded-xl text-xs text-center font-medium",
                  result.ok
                    ? "bg-green-50 text-green-700 border border-green-100"
                    : "bg-red-50 text-red-600 border border-red-100"
                )}>
                  {result.text}
                </div>
              )}

              <button
                onClick={handleSend}
                disabled={loading || !message.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-forest text-cream text-sm font-semibold hover:bg-moss transition-all disabled:opacity-50"
              >
                {loading ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : <><Send size={13} /> Send message</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const inp = "w-full px-4 py-2.5 rounded-xl border border-mist bg-white text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-forest/50 focus:ring-2 focus:ring-forest/10 transition-all";
