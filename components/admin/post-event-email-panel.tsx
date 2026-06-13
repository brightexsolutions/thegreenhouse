"use client";

import { useState } from "react";
import { Mail, CheckCircle2, Loader2, Send } from "lucide-react";

interface Props {
  eventId:   string;
  alreadySent: boolean;
  emailCount:  number;
}

export function PostEventEmailPanel({ eventId, alreadySent, emailCount }: Props) {
  const [sent,    setSent]    = useState(alreadySent);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<{ sent: number; failed: number } | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  async function sendNow() {
    if (!confirm(`Send a post-event thank-you email to all ${emailCount} registrant${emailCount !== 1 ? "s" : ""} with email addresses?`)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/post-event-email`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setResult(data);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-mist p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-forest/8 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Mail size={16} className="text-forest" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-charcoal">Post-event thank-you email</h3>
          <p className="text-xs text-charcoal/50 mt-0.5 leading-relaxed">
            Sends a personal thank-you to every registrant who provided an email, with a link to leave feedback.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-off-white border border-mist mb-4">
        <span className="text-xs text-charcoal/50">{emailCount} email registrant{emailCount !== 1 ? "s" : ""}</span>
        {sent ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <CheckCircle2 size={12} /> Sent
          </span>
        ) : (
          <span className="text-xs text-charcoal/40">Not sent yet</span>
        )}
      </div>

      {result && (
        <div className="text-xs text-emerald-600 mb-3 px-1">
          ✓ Delivered to {result.sent} registrant{result.sent !== 1 ? "s" : ""}
          {result.failed > 0 ? ` · ${result.failed} failed` : ""}
        </div>
      )}
      {error && <p className="text-xs text-red-500 mb-3 px-1">{error}</p>}

      {sent && !result ? (
        <button
          type="button"
          onClick={sendNow}
          disabled={loading || emailCount === 0}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-mist text-xs text-charcoal/50 hover:border-forest/20 hover:text-forest transition-all disabled:opacity-40"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          Re-send to all
        </button>
      ) : !sent ? (
        <button
          type="button"
          onClick={sendNow}
          disabled={loading || emailCount === 0}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-forest text-cream text-xs font-semibold hover:bg-moss transition-colors disabled:opacity-40"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          {loading ? "Sending…" : "Send now"}
        </button>
      ) : null}

      <p className="text-[11px] text-charcoal/30 mt-3 text-center leading-relaxed">
        This also runs automatically every 6 hours via the cron job.
      </p>
    </div>
  );
}
