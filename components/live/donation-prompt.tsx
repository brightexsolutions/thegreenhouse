"use client";

import { useEffect, useState } from "react";
import { X, Heart, Smartphone, MessageCircle, Plus, Loader2 } from "lucide-react";

interface GivingDetails {
  paybill?: string | null;
  account?: string | null;
  till?:    string | null;
  phone?:   string | null;
}

interface Props {
  eventId: string;
  giving:  GivingDetails;
  /** Delay in ms before the give prompt appears. Default: 3 minutes. */
  delayMs?: number;
}

const GIVE_KEY  = "gh_donation_dismissed_at";
const SNOOZE_MS = 25 * 60 * 1000;

type Panel = "give" | "feedback" | null;

export function DonationPrompt({ eventId, giving, delayMs = 3 * 60 * 1000 }: Props) {
  const [fabVisible, setFabVisible] = useState(false);
  const [fabOpen,    setFabOpen]    = useState(false);
  const [panel,      setPanel]      = useState<Panel>(null);

  // Feedback form state
  const [attended,   setAttended]   = useState(true);
  const [name,       setName]       = useState("");
  const [anonymous,  setAnonymous]  = useState(false);
  const [message,    setMessage]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [fbError,    setFbError]    = useState<string | null>(null);

  const hasPayment = giving.paybill || giving.till || giving.phone;

  useEffect(() => {
    // FAB appears after a short delay so page settles first
    const t1 = setTimeout(() => setFabVisible(true), 3000);

    // Auto-open give panel after configured delay
    const dismissed = localStorage.getItem(GIVE_KEY);
    if (dismissed) {
      const elapsed = Date.now() - Number(dismissed);
      if (elapsed >= SNOOZE_MS && hasPayment) {
        const t2 = setTimeout(() => { setFabOpen(false); setPanel("give"); }, delayMs);
        return () => { clearTimeout(t1); clearTimeout(t2); };
      }
    } else if (hasPayment) {
      const t2 = setTimeout(() => { setPanel("give"); }, delayMs);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }

    return () => clearTimeout(t1);
  }, [delayMs, hasPayment]);

  function closePanel() {
    if (panel === "give") localStorage.setItem(GIVE_KEY, String(Date.now()));
    setPanel(null);
    setFabOpen(false);
  }

  async function submitFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    setFbError(null);
    try {
      const res = await fetch("/api/feedback", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          name:     anonymous ? undefined : name.trim() || undefined,
          message:  message.trim(),
          attended,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch {
      setFbError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!fabVisible) return null;

  return (
    <>
      {/* Backdrop when a panel is open */}
      {panel && (
        <div className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]" onClick={closePanel} aria-hidden />
      )}

      {/* Panel */}
      {panel && (
        <div
          role="dialog"
          className="fixed z-50 bottom-0 left-0 right-0 sm:bottom-6 sm:right-6 sm:left-auto sm:w-[340px] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
          style={{ animation: "livePanel 0.35s cubic-bezier(0.32,0.72,0,1) both" }}
        >
          <style>{`@keyframes livePanel{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}`}</style>

          {/* ── Give panel ── */}
          {panel === "give" && (
            <>
              <div className="relative bg-forest px-6 pt-6 pb-5 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_-10%,rgba(201,162,74,0.15),transparent)]" />
                <button onClick={closePanel} aria-label="Close" className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <X size={13} className="text-cream/70" />
                </button>
                <div className="relative flex items-start gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Heart size={16} className="text-gold" />
                  </div>
                  <div>
                    <p className="text-[10px] label-caps text-gold/70 mb-0.5">Support the mission</p>
                    <h3 className="font-display text-xl font-semibold text-cream leading-tight">Give tonight</h3>
                    <p className="text-cream/55 text-xs mt-1 leading-relaxed">
                      Venue, production, outreach — your contribution keeps this going.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white px-6 pt-5 pb-6 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Smartphone size={13} className="text-forest/60" />
                  <span className="text-xs font-semibold text-charcoal/70">Via M-Pesa</span>
                </div>
                {giving.paybill && (
                  <div className="rounded-2xl bg-off-white border border-mist px-4 py-3">
                    <p className="text-[10px] label-caps text-charcoal/40 mb-2">Paybill</p>
                    <div className="space-y-1.5">
                      <PayRow step="1" label="Business No." value={giving.paybill} />
                      {giving.account && <PayRow step="2" label="Account No." value={giving.account} />}
                      <PayRow step={giving.account ? "3" : "2"} label="Amount" value="Any amount" dim />
                    </div>
                  </div>
                )}
                {giving.till && !giving.paybill && (
                  <div className="rounded-2xl bg-off-white border border-mist px-4 py-3">
                    <p className="text-[10px] label-caps text-charcoal/40 mb-2">Buy Goods</p>
                    <PayRow step="1" label="Till number" value={giving.till} />
                  </div>
                )}
                {giving.phone && (
                  <div className="rounded-2xl bg-off-white border border-mist px-4 py-3">
                    <p className="text-[10px] label-caps text-charcoal/40 mb-2">Send Money</p>
                    <PayRow step="1" label="Phone" value={giving.phone} />
                  </div>
                )}
                <button onClick={closePanel} className="w-full py-2.5 rounded-full border border-mist text-xs text-charcoal/50 hover:border-forest/20 hover:text-forest transition-all mt-1">
                  Maybe later
                </button>
              </div>
            </>
          )}

          {/* ── Feedback panel ── */}
          {panel === "feedback" && (
            <>
              <div className="relative bg-forest px-6 pt-6 pb-5 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_-10%,rgba(201,162,74,0.10),transparent)]" />
                <button onClick={closePanel} aria-label="Close" className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <X size={13} className="text-cream/70" />
                </button>
                <div className="relative flex items-start gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageCircle size={16} className="text-gold" />
                  </div>
                  <div>
                    <p className="text-[10px] label-caps text-gold/70 mb-0.5">Share your heart</p>
                    <h3 className="font-display text-xl font-semibold text-cream leading-tight">
                      {submitted ? "Thank you." : "Leave a reflection"}
                    </h3>
                    <p className="text-cream/55 text-xs mt-1 leading-relaxed">
                      {submitted ? "Your words mean a lot to us." : "What's on your heart right now?"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white px-6 pt-5 pb-6">
                {submitted ? (
                  <button onClick={closePanel} className="w-full py-2.5 rounded-full bg-forest text-cream text-xs font-semibold hover:bg-moss transition-colors">
                    Close
                  </button>
                ) : (
                  <form onSubmit={submitFeedback} className="space-y-3">
                    {!anonymous && (
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Your name (optional)"
                        maxLength={80}
                        className="w-full px-4 py-2.5 rounded-xl border border-mist text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 placeholder:text-charcoal/30"
                      />
                    )}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} className="w-3.5 h-3.5 rounded accent-forest" />
                      <span className="text-xs text-charcoal/50">Stay anonymous</span>
                    </label>
                    <div>
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value.slice(0, 280))}
                        placeholder="What's moved you tonight?"
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-mist text-sm resize-none focus:outline-none focus:ring-2 focus:ring-forest/20 placeholder:text-charcoal/30"
                      />
                      <span className="text-[11px] text-charcoal/30 float-right">{message.length}/280</span>
                    </div>
                    {fbError && <p className="text-xs text-red-500">{fbError}</p>}
                    <button
                      type="submit"
                      disabled={submitting || !message.trim()}
                      className="w-full py-2.5 rounded-full bg-forest text-cream text-xs font-semibold hover:bg-moss transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
                    >
                      {submitting ? <><Loader2 size={11} className="animate-spin" /> Sending…</> : "Send reflection"}
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* FAB — always visible once revealed */}
      {!panel && (
        <div className="fixed bottom-6 right-5 z-50 flex flex-col items-end gap-2" style={{ animation: "livePanel 0.3s cubic-bezier(0.32,0.72,0,1) both" }}>

          {/* Speed-dial actions */}
          {fabOpen && (
            <>
              {hasPayment && (
                <button
                  onClick={() => { setFabOpen(false); setPanel("give"); }}
                  className="flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-full bg-white border border-mist shadow-md text-xs font-semibold text-charcoal hover:border-forest/20 hover:text-forest transition-all"
                >
                  <span className="w-6 h-6 rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0">
                    <Heart size={11} className="text-gold" />
                  </span>
                  Give
                </button>
              )}
              <button
                onClick={() => { setFabOpen(false); setPanel("feedback"); }}
                className="flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-full bg-white border border-mist shadow-md text-xs font-semibold text-charcoal hover:border-forest/20 hover:text-forest transition-all"
              >
                <span className="w-6 h-6 rounded-full bg-forest/10 flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={11} className="text-forest" />
                </span>
                Reflection
              </button>
            </>
          )}

          {/* Main FAB button */}
          <button
            onClick={() => setFabOpen(v => !v)}
            className="w-12 h-12 rounded-full bg-forest text-cream shadow-lg hover:bg-moss transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center"
            aria-label={fabOpen ? "Close actions" : "Actions"}
          >
            <Plus size={20} className={`transition-transform duration-200 ${fabOpen ? "rotate-45" : ""}`} />
          </button>
        </div>
      )}
    </>
  );
}

function PayRow({ step, label, value, dim }: { step: string; label: string; value: string; dim?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="w-4 h-4 rounded-full bg-forest/10 flex items-center justify-center text-[9px] font-bold text-forest/60 flex-shrink-0">{step}</span>
        <span className="text-xs text-charcoal/50">{label}</span>
      </div>
      <span className={`text-xs font-semibold ${dim ? "text-charcoal/35" : "text-forest"}`}>{value}</span>
    </div>
  );
}
