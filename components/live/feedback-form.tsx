"use client";

import { useState } from "react";
import { MessageSquare, Send, Loader2, CheckCircle2 } from "lucide-react";

interface FeedbackFormProps {
  eventId: string;
}

export function FeedbackForm({ eventId }: FeedbackFormProps) {
  const [message,    setMessage]    = useState("");
  const [authorName, setAuthorName] = useState("");
  const [anonymous,  setAnonymous]  = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/live-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id:    eventId,
        message:     message.trim(),
        author_name: anonymous ? null : authorName.trim() || null,
      }),
    });

    if (res.ok) {
      setDone(true);
      setMessage("");
      setAuthorName("");
    } else {
      const data = await res.json().catch(() => ({})) as { error?: string };
      setError(data.error ?? "Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  return (
    <div className="bg-white rounded-3xl border border-mist overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-mist flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-forest/8 flex items-center justify-center flex-shrink-0">
          <MessageSquare size={15} className="text-forest" />
        </div>
        <div>
          <p className="text-sm font-semibold text-charcoal">Share a thought or question</p>
          <p className="text-xs text-charcoal/45 mt-0.5">
            Your message may appear on the display screen
          </p>
        </div>
      </div>

      {done ? (
        <div className="px-5 py-10 text-center">
          <CheckCircle2 size={30} className="text-forest mx-auto mb-3" />
          <p className="text-sm font-semibold text-charcoal">Received — thank you!</p>
          <p className="text-xs text-charcoal/50 mt-1.5 leading-relaxed">
            Your message has been sent to the team.
          </p>
          <button
            onClick={() => setDone(false)}
            className="mt-5 text-xs text-forest underline underline-offset-2"
          >
            Send another
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="px-5 py-4 space-y-3">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Share a reflection, question, or encouragement…"
            maxLength={280}
            rows={3}
            className="w-full px-3.5 py-3 rounded-2xl border border-charcoal/15 text-base text-charcoal
                       placeholder:text-charcoal/35 bg-off-white focus:outline-none focus:ring-2
                       focus:ring-forest/20 focus:border-forest/40 resize-none transition-all leading-relaxed"
          />
          <p className="text-right text-[11px] text-charcoal/30 -mt-1">{message.length}/280</p>

          {/* Anonymous toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative flex-shrink-0">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={e => setAnonymous(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 rounded-full bg-charcoal/20 peer-checked:bg-forest transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
            </div>
            <span className="text-sm text-charcoal/65">Post anonymously</span>
          </label>

          {!anonymous && (
            <input
              type="text"
              value={authorName}
              onChange={e => setAuthorName(e.target.value)}
              placeholder="Your name (optional)"
              maxLength={60}
              className="w-full px-3.5 py-3 rounded-xl border border-charcoal/15 text-base text-charcoal
                         placeholder:text-charcoal/35 bg-off-white focus:outline-none focus:ring-2
                         focus:ring-forest/20 focus:border-forest/40 transition-all"
            />
          )}

          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="w-full py-3.5 rounded-full bg-forest text-cream text-sm font-semibold
                       disabled:opacity-40 flex items-center justify-center gap-2 transition-all hover:bg-moss"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {submitting ? "Sending…" : "Send message"}
          </button>
        </form>
      )}
    </div>
  );
}
