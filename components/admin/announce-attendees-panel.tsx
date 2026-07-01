"use client";

import { useState } from "react";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Megaphone, CheckCircle2, Loader2, Send, Gift } from "lucide-react";

interface Props {
  eventId:          string;
  eventTitle:       string;
  isPaid:           boolean;
  hasEarlyBird:     boolean;
  earlyBirdDate?:   string | null;  // formatted display date
}

export function AnnounceAttendeesPanel({ eventId, eventTitle, isPaid, hasEarlyBird, earlyBirdDate }: Props) {
  const confirm = useConfirm();
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<{ sent: number; failed: number; skipped: number; message?: string } | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  async function announce() {
    const earlyBirdNote = hasEarlyBird && earlyBirdDate
      ? ` Past attendees who register before ${earlyBirdDate} will get their entry fee waived.`
      : "";
    const ok = await confirm({
      title:        "Announce to past attendees",
      message:      `This will email every past attendee (who hasn't already registered for ${eventTitle}) about this upcoming session.${earlyBirdNote} This cannot be undone.`,
      confirmLabel: "Send announcements",
    });
    if (!ok) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/announce-attendees`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      setResult(data);
      if (data.sent > 0) setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-mist p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Megaphone size={16} className="text-gold/80" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-charcoal">Announce to past attendees</h3>
          <p className="text-xs text-charcoal/50 mt-0.5 leading-relaxed">
            Emails every past session attendee (with an email address) who hasn&apos;t yet registered for this event.
            {hasEarlyBird && earlyBirdDate && (
              <> Includes an <span className="text-gold/80 font-medium">early bird offer</span> — free entry until {earlyBirdDate}.</>
            )}
          </p>
        </div>
      </div>

      {isPaid && hasEarlyBird && earlyBirdDate && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gold/8 border border-gold/20 mb-4">
          <Gift size={13} className="text-gold/80 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-charcoal/70 leading-relaxed">
            Early bird active — past attendees who register before <strong>{earlyBirdDate}</strong> will receive a waived entry fee.
          </p>
        </div>
      )}

      {result && (
        <div className="py-3 px-4 rounded-xl bg-off-white border border-mist mb-4 space-y-1">
          {result.message ? (
            <p className="text-xs text-charcoal/60 leading-relaxed">{result.message}</p>
          ) : (
            <>
              <p className="text-xs font-medium text-emerald-600">
                <CheckCircle2 size={12} className="inline mr-1 mb-0.5" />
                {result.sent} announcement{result.sent !== 1 ? "s" : ""} sent
              </p>
              {result.failed > 0 && <p className="text-xs text-red-500">{result.failed} failed</p>}
              {result.skipped > 0 && <p className="text-xs text-charcoal/40">{result.skipped} already registered — skipped</p>}
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500 mb-3 px-1">{error}</p>}

      <button
        type="button"
        onClick={announce}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded bg-forest text-cream text-xs font-semibold hover:bg-moss transition-colors disabled:opacity-40"
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
        {loading ? "Sending…" : sent ? "Send again" : "Send announcements"}
      </button>

      {sent && !loading && (
        <p className="text-[11px] text-charcoal/30 mt-3 text-center leading-relaxed">
          Already sent once. You can send again to catch anyone added since.
        </p>
      )}
    </div>
  );
}
