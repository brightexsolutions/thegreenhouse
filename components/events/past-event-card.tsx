"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { EventShareButtons } from "@/components/events/event-share-buttons";
import { SITE_URL } from "@/lib/constants";
import type { Event } from "@/types/database";

const MAX_CHARS = 280;

export function PastEventCard({ event }: { event: Event }) {
  const [attended,   setAttended]   = useState(true);
  const [name,       setName]       = useState("");
  const [anonymous,  setAnonymous]  = useState(false);
  const [message,    setMessage]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const charsLeft = MAX_CHARS - message.length;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: event.id,
          name:     anonymous ? undefined : name.trim() || undefined,
          message:  message.trim(),
          attended,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const shareUrl = `${SITE_URL}/events/${event.slug}`;
  const formattedDate = new Date(event.event_date).toLocaleDateString("en-KE", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="sticky top-28 rounded-3xl overflow-hidden border border-mist shadow-card">

      {/* Header */}
      <div className="relative bg-forest px-7 pt-7 pb-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(201,162,74,0.10),transparent)]" />
        <div className="absolute top-3 right-14 w-14 h-14 rounded-full border border-cream/5" />
        <div className="relative">
          <span className="label-caps text-gold/70 text-xs">Session complete</span>
          <h3 className="font-display text-2xl font-semibold text-cream mt-1 leading-tight">
            {submitted ? "Thank you." : "We want to hear from you"}
          </h3>
          <p className="text-cream/55 text-sm mt-1.5 leading-relaxed">
            {submitted
              ? "Your reflection has been received — it shapes what we build next."
              : "Whether you were there or couldn't make it, your voice matters to us."
            }
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="bg-off-white px-7 py-6">

        {submitted ? (
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 size={32} className="text-forest/60" />
              <p className="text-sm text-charcoal/60 leading-relaxed max-w-[200px]">
                {attended
                  ? `We're glad you were part of ${event.title}.`
                  : "We hope to see you at the next one."}
              </p>
            </div>
            <div className="pt-3 border-t border-mist">
              <p className="text-xs text-charcoal/40 mb-2 text-center">Share this session</p>
              <EventShareButtons
                url={shareUrl}
                title={event.title}
                date={formattedDate}
                variant="card"
                message="Worth attending — check it out"
              />
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">

            {/* Attended toggle */}
            <div className="flex items-center gap-2 p-1 bg-mist/60 rounded-full w-fit">
              <button
                type="button"
                onClick={() => setAttended(true)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${attended ? "bg-forest text-cream shadow-sm" : "text-charcoal/50"}`}
              >
                I attended
              </button>
              <button
                type="button"
                onClick={() => setAttended(false)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${!attended ? "bg-forest text-cream shadow-sm" : "text-charcoal/50"}`}
              >
                Couldn&apos;t make it
              </button>
            </div>

            {/* Name field — hidden when anonymous */}
            {!anonymous && (
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  maxLength={80}
                  className="w-full px-4 py-2.5 rounded-xl border border-mist text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/30 transition-all placeholder:text-charcoal/30"
                />
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={e => setAnonymous(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-forest"
              />
              <span className="text-xs text-charcoal/50">Stay anonymous</span>
            </label>

            {/* Feedback textarea */}
            <div>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value.slice(0, MAX_CHARS))}
                placeholder={attended
                  ? "What did this session mean to you? What stayed with you?"
                  : "What made it hard to attend? What would you hope for next time?"
                }
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-mist text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/30 transition-all placeholder:text-charcoal/30"
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-[11px] text-charcoal/35">
                  {charsLeft < 50 ? `${charsLeft} characters left` : ""}
                </span>
                <span className="text-[11px] text-charcoal/30">{message.length}/{MAX_CHARS}</span>
              </div>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="w-full py-3 rounded-full bg-forest text-cream text-sm font-semibold hover:bg-moss transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 size={13} className="animate-spin" /> Sending…</> : "Submit feedback"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
