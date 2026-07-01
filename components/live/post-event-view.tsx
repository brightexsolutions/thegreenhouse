"use client";

import { useState } from "react";
import { Leaf, CheckCircle2, Send, Loader2, CalendarDays, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface NextEvent {
  title:      string;
  event_date: string;
  slug:       string;
}

interface PostEventViewProps {
  eventId:       string;
  eventTitle:    string;
  themeTitle:    string | null;
  themeScripture: string | null;
  nextEvent:     NextEvent | null;
}

export function PostEventView({
  eventId,
  eventTitle,
  themeTitle,
  themeScripture,
  nextEvent,
}: PostEventViewProps) {
  const [message,    setMessage]    = useState("");
  const [name,       setName]       = useState("");
  const [attended,   setAttended]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/feedback", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        event_id: eventId,
        name:     name.trim() || undefined,
        message:  message.trim(),
        attended,
      }),
    });

    if (res.ok) {
      setDone(true);
    } else {
      const data = await res.json().catch(() => ({})) as { error?: string };
      setError(data.error ?? "Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  const nextDate = nextEvent
    ? new Date(nextEvent.event_date).toLocaleDateString("en-KE", {
        weekday: "short", day: "numeric", month: "long", year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-cream flex flex-col">

      {/* Header */}
      <div className="bg-forest px-4 pt-12 pb-10">
        <div className="max-w-md mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-1.5 mb-4">
              <Leaf size={12} className="text-gold" />
              <span className="label-caps text-gold/70 text-[9px]">The Green House</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-cream leading-tight mb-2">
              {eventTitle}
            </h1>
            {themeTitle && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/15 border border-gold/30">
                <span className="text-[10px] label-caps text-gold/70">Theme</span>
                <span className="text-xs text-gold">{themeTitle}</span>
                {themeScripture && (
                  <span className="text-[10px] text-gold/60">· {themeScripture}</span>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full px-4 py-8 space-y-5">

        {/* Session concluded card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-mist p-6 text-center"
        >
          <div className="w-10 h-10 rounded-2xl bg-forest/8 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={18} className="text-forest" />
          </div>
          <p className="text-base font-semibold text-charcoal">This session has concluded.</p>
          <p className="text-sm text-charcoal/45 mt-1.5 leading-relaxed">
            Thank you to everyone who joined us — it was a beautiful evening. We&apos;d love to hear from you.
          </p>
        </motion.div>

        {/* Feedback form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-mist overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-mist">
            <p className="text-sm font-semibold text-charcoal">Share your thoughts</p>
            <p className="text-xs text-charcoal/45 mt-0.5">
              What did you take away from this session? What stood out?
            </p>
          </div>

          {done ? (
            <div className="px-5 py-10 text-center">
              <CheckCircle2 size={28} className="text-forest mx-auto mb-3" />
              <p className="text-sm font-semibold text-charcoal">Thank you!</p>
              <p className="text-xs text-charcoal/50 mt-1.5 leading-relaxed">
                Your feedback means a lot to us and helps shape future sessions.
              </p>
              <button
                onClick={() => { setDone(false); setMessage(""); setName(""); }}
                className="mt-5 text-xs text-forest underline underline-offset-2"
              >
                Submit another
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="px-5 py-4 space-y-3">
              {/* Attended toggle */}
              <div className="flex items-center gap-2 text-xs text-charcoal/60">
                <span>I</span>
                <button
                  type="button"
                  onClick={() => setAttended(v => !v)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                    attended
                      ? "bg-forest text-cream border-forest"
                      : "bg-off-white text-charcoal/50 border-charcoal/15"
                  }`}
                >
                  attended in person
                </button>
                <span>/</span>
                <button
                  type="button"
                  onClick={() => setAttended(v => !v)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                    !attended
                      ? "bg-forest text-cream border-forest"
                      : "bg-off-white text-charcoal/50 border-charcoal/15"
                  }`}
                >
                  watched online
                </button>
              </div>

              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="What stood out for you? A moment, a song, a thought…"
                maxLength={280}
                rows={4}
                className="w-full px-3.5 py-3 rounded-2xl border border-charcoal/15 text-base text-charcoal
                           placeholder:text-charcoal/35 bg-off-white focus:outline-none focus:ring-2
                           focus:ring-forest/20 focus:border-forest/40 resize-none transition-all leading-relaxed"
              />
              <p className="text-right text-[11px] text-charcoal/30 -mt-1">{message.length}/280</p>

              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name (optional)"
                maxLength={60}
                className="w-full px-3.5 py-3 rounded-xl border border-charcoal/15 text-base text-charcoal
                           placeholder:text-charcoal/35 bg-off-white focus:outline-none focus:ring-2
                           focus:ring-forest/20 focus:border-forest/40 transition-all"
              />

              {error && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className="w-full py-3.5 rounded-full bg-forest text-cream text-sm font-semibold
                           disabled:opacity-40 flex items-center justify-center gap-2 transition-all hover:bg-moss"
              >
                {submitting
                  ? <><Loader2 size={14} className="animate-spin" /> Sending…</>
                  : <><Send size={14} /> Send feedback</>}
              </button>
            </form>
          )}
        </motion.div>

        {/* Next event card */}
        {nextEvent && nextDate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link
              href={`/events/${nextEvent.slug}`}
              className="block bg-forest rounded-3xl p-5 hover:bg-moss transition-colors group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CalendarDays size={11} className="text-gold/80" />
                    <span className="label-caps text-gold/70 text-[9px]">Up next</span>
                  </div>
                  <p className="text-sm font-semibold text-cream leading-snug">{nextEvent.title}</p>
                  <p className="text-xs text-cream/50 mt-1">{nextDate}</p>
                </div>
                <div className="w-8 h-8 rounded-full border border-cream/20 flex items-center justify-center flex-shrink-0 group-hover:border-cream/50 transition-colors">
                  <ArrowRight size={14} className="text-cream/60" />
                </div>
              </div>
            </Link>
          </motion.div>
        )}

      </div>
    </div>
  );
}
