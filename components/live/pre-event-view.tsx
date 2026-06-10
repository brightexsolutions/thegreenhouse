"use client";

import { useState, useEffect } from "react";
import { Leaf, BookOpen, MessageSquare, Music2, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface PreEventViewProps {
  eventTitle:      string;
  eventDate:       string;
  eventTime:       string;
  venueName:       string | null;
  themeTitle:      string | null;
  themeScripture:  string | null;
  isPast:          boolean;
}

function useCountdown(targetDate: string, targetTime: string) {
  const [diff, setDiff] = useState<number>(0);

  useEffect(() => {
    function calc() {
      const target = new Date(`${targetDate}T${targetTime}`);
      setDiff(target.getTime() - Date.now());
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate, targetTime]);

  const totalSeconds = Math.max(0, Math.floor(diff / 1000));
  const days    = Math.floor(totalSeconds / 86400);
  const hours   = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { diff, days, hours, minutes, seconds };
}

const FEATURES = [
  {
    icon:  Music2,
    title: "Tonight's Program",
    desc:  "Follow along with the program as it unfolds — session by session.",
  },
  {
    icon:  BookOpen,
    title: "Song Lyrics",
    desc:  "Every song's lyrics right on your phone so you can worship with us.",
  },
  {
    icon:  MessageSquare,
    title: "Drop a Thought",
    desc:  "Share what's on your heart — questions, reflections, or a word. We're listening.",
  },
];

export function PreEventView({
  eventTitle, eventDate, eventTime, venueName, themeTitle, themeScripture, isPast,
}: PreEventViewProps) {
  const { diff, days, hours, minutes, seconds } = useCountdown(eventDate, eventTime);
  const formattedDate = new Date(eventDate).toLocaleDateString("en-KE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const formattedTime = eventTime.slice(0, 5);

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

            <p className="text-cream/50 text-sm">
              {formattedDate} &middot; {formattedTime}pm
              {venueName && venueName !== "TBA" && ` · ${venueName}`}
            </p>

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

      <div className="flex-1 max-w-md mx-auto w-full px-4 py-8 space-y-6">
        {/* Countdown or past state */}
        {isPast ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-mist p-6 text-center"
          >
            <p className="text-sm font-medium text-charcoal/60">This session has ended.</p>
            <p className="text-xs text-charcoal/35 mt-1">
              Thank you to everyone who joined us — see you at the next one.
            </p>
          </motion.div>
        ) : diff <= 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-forest rounded-3xl p-6 text-center"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 mx-auto mb-3 animate-pulse" />
            <p className="text-cream font-semibold text-lg">Starting now</p>
            <p className="text-cream/50 text-sm mt-1">Refresh the page to access tonight&apos;s program.</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-3xl border border-mist p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <Clock size={14} className="text-charcoal/30" />
              <p className="text-xs font-medium text-charcoal/40 uppercase tracking-wider">Session begins in</p>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[
                { value: days,    label: "days"    },
                { value: hours,   label: "hours"   },
                { value: minutes, label: "min"     },
                { value: seconds, label: "sec"     },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="bg-forest rounded-2xl py-3 px-1 mb-1.5">
                    <span className="font-display text-2xl font-semibold text-cream tabular-nums">
                      {String(value).padStart(2, "0")}
                    </span>
                  </div>
                  <span className="text-[10px] text-charcoal/35 uppercase tracking-wider">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* What this page does */}
        {!isPast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-3"
          >
            <p className="text-xs font-semibold text-charcoal/35 uppercase tracking-wider px-1">
              On the night, this page will be your
            </p>

            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="bg-white rounded-2xl border border-mist px-4 py-4 flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-forest/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={15} className="text-forest" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-charcoal">{title}</p>
                  <p className="text-xs text-charcoal/45 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Bookmark hint */}
        {!isPast && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-[11px] text-charcoal/30 pb-4"
          >
            Keep this page open or bookmark it — it goes live when the session starts.
          </motion.p>
        )}
      </div>
    </div>
  );
}
