"use client";

import { useState, useRef, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  Music2, BookOpen, Heart, ChevronDown, MessageSquare,
  Smile, ThumbsUp, Sparkles, Mic,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { FeedbackForm } from "./feedback-form";
import { AttendeePhotoShare } from "./attendee-photo-share";
import { TriviaAttendeeCard } from "./trivia-attendee-card";
import { cn } from "@/lib/utils";

type Song = { id: string; title: string; artist: string | null; lyrics: string | null };

type Session = {
  id:           string;
  title:        string;
  type:         string;
  duration_min: number | null;
  sort_order:   number;
  session_songs: Array<{
    id:         string;
    sort_order: number;
    vocalist:   string | null;
    item_type:  string;
    item_text:  string | null;
    songs:      Song | null;
  }>;
};

type Theme = {
  title:       string | null;
  scripture:   string | null;
  description: string | null;
};

interface Props {
  eventId:  string;
  sessions: Session[];
  theme:    Theme;
  slug:     string;
}

const SESSION_ICONS: Record<string, typeof Music2> = {
  worship:  Music2,
  prayer:   Heart,
  teaching: BookOpen,
};

const FEEDBACK_PROMPTS = [
  { icon: Smile,    text: "How are you feeling right now?" },
  { icon: ThumbsUp, text: "Something resonating? Drop it here →" },
  { icon: Sparkles, text: "Got a thought or a question? Share it." },
];

// Nudge toast appears after 12 minutes, once per page load, dismissed per session
const NUDGE_DELAY_MS = 12 * 60 * 1000;

export function LiveAttendeeView({ eventId, sessions, theme, slug }: Props) {
  const [openSong,       setOpenSong]     = useState<string | null>(null);
  const [openSession,    setOpenSession]  = useState<string | null>(null);
  const [showFeedback,   setShowFeedback] = useState(false);
  const [engagedCount,   setEngagedCount] = useState(0);
  const [activeSongId,   setActiveSongId] = useState<string | null>(null);
  const [showNudge,      setShowNudge]    = useState(false);
  const [displayScene,   setDisplayScene] = useState<string | null>(null);
  const [triviaRoundId,  setTriviaRoundId] = useState<string | null>(null);
  const promptRef = useRef<HTMLDivElement>(null);

  // Time-based nudge — fires after NUDGE_DELAY_MS, once per session storage key
  useEffect(() => {
    const key = `nudge_dismissed_${eventId}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key)) return;
    const t = setTimeout(() => setShowNudge(true), NUDGE_DELAY_MS);
    return () => clearTimeout(t);
  }, [eventId]);

  function dismissNudge(andOpen?: boolean) {
    setShowNudge(false);
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(`nudge_dismissed_${eventId}`, "1");
    }
    if (andOpen) {
      setShowFeedback(true);
      setTimeout(() => promptRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
  }

  // Subscribe to display_state and poll as a fallback so trivia + song state
  // always reflects the current DB row, even when Realtime events are delayed.
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function syncDisplayState() {
      const { data } = await supabase
        .from("display_state")
        .select("song_id, scene, trivia_round_id")
        .eq("event_id", eventId)
        .maybeSingle();
      if (data) {
        const row = data as { song_id: string | null; scene: string | null; trivia_round_id: string | null };
        setActiveSongId(row.song_id);
        setDisplayScene(row.scene);
        setTriviaRoundId(row.trivia_round_id);
      }
    }

    // Initial fetch
    syncDisplayState();

    // Realtime subscription — delivers changes instantly when publication is configured
    const channel = supabase
      .channel(`attendee-display-${eventId}`)
      .on("postgres_changes", {
        event:  "*",
        schema: "public",
        table:  "display_state",
        filter: `event_id=eq.${eventId}`,
      }, (payload) => {
        const row = payload.new as { song_id?: string | null; scene?: string | null; trivia_round_id?: string | null };
        // Guard against empty payload (e.g. DELETE or RLS-blocked event)
        if (row && Object.keys(row).length > 0) {
          setActiveSongId(row.song_id ?? null);
          setDisplayScene(row.scene ?? null);
          setTriviaRoundId(row.trivia_round_id ?? null);
        }
      })
      .subscribe();

    // Polling fallback — catches any Realtime gaps every 5 s
    const poll = setInterval(syncDisplayState, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [eventId]);

  // Auto-expand the session containing the active song
  useEffect(() => {
    if (!activeSongId) return;
    for (const session of sessions) {
      if (session.session_songs.some(ss => ss.songs?.id === activeSongId)) {
        setOpenSession(session.id);
        setOpenSong(activeSongId);
        break;
      }
    }
  }, [activeSongId, sessions]);

  function onEngaged() {
    setEngagedCount(c => c + 1);
  }

  const promptIndex    = engagedCount >= 2 ? (engagedCount - 2) % FEEDBACK_PROMPTS.length : -1;
  const currentPrompt  = promptIndex >= 0 ? FEEDBACK_PROMPTS[promptIndex] : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-3 pb-16">

      {/* Active trivia — floats above everything else when live */}
      <AnimatePresence>
        {displayScene === "trivia" && triviaRoundId && (
          <TriviaAttendeeCard key={triviaRoundId} roundId={triviaRoundId} />
        )}
      </AnimatePresence>

      {/* Sessions */}
      {sessions.length === 0 ? (
        <div className="text-center py-16 text-charcoal/30">
          <Music2 size={32} className="mx-auto mb-3" />
          <p className="text-sm">Program coming soon</p>
        </div>
      ) : (
        sessions.map((session, i) => {
          const Icon   = SESSION_ICONS[session.type] ?? Music2;
          const isOpen = openSession === session.id;
          const hasSongs = session.session_songs.length > 0;
          const hasActive = session.session_songs.some(ss => ss.songs?.id === activeSongId);

          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.35 }}
              className={cn(
                "bg-white rounded-3xl border overflow-hidden transition-colors",
                hasActive ? "border-forest/30 ring-1 ring-forest/10" : "border-mist"
              )}
            >
              <button
                className={cn(
                  "w-full px-5 py-4 flex items-center gap-3 text-left transition-colors",
                  hasSongs ? "hover:bg-off-white active:bg-mist/50" : "cursor-default",
                  isOpen && hasSongs && "bg-off-white"
                )}
                onClick={() => {
                  if (!hasSongs) return;
                  const next = isOpen ? null : session.id;
                  setOpenSession(next);
                  if (next) onEngaged();
                }}
                aria-expanded={isOpen}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  hasActive ? "bg-forest/15" : "bg-forest/8"
                )}>
                  <Icon size={16} className="text-forest" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-charcoal">{session.title}</p>
                  <p className="text-[11px] text-charcoal/40 capitalize mt-0.5">
                    {session.type}{session.duration_min ? ` · ${session.duration_min} min` : ""}
                    {hasSongs ? ` · ${session.session_songs.length} item${session.session_songs.length > 1 ? "s" : ""}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {hasActive && (
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  )}
                  <span className="text-[10px] text-charcoal/20 font-medium">#{i + 1}</span>
                  {hasSongs && (
                    <ChevronDown
                      size={16}
                      className={cn("text-charcoal/25 transition-transform duration-200", isOpen && "rotate-180")}
                    />
                  )}
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && hasSongs && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{   height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-mist">
                      {[...session.session_songs]
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((ss) => {
                          if (ss.item_type !== "song") {
                            return (
                              <div key={ss.id} className="px-5 py-3 flex items-start gap-3 border-b border-mist/60 last:border-b-0">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <MessageSquare size={13} className="text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-charcoal/80 leading-snug">{ss.item_text}</p>
                                  <p className="text-[10px] text-charcoal/35 capitalize mt-1">{ss.item_type}</p>
                                </div>
                              </div>
                            );
                          }
                          if (!ss.songs) return null;
                          return (
                            <SongRow
                              key={ss.id}
                              song={ss.songs}
                              vocalist={ss.vocalist}
                              isOpen={openSong === ss.songs.id}
                              isActive={ss.songs.id === activeSongId}
                              onToggle={() => {
                                const next = openSong === ss.songs!.id ? null : ss.songs!.id;
                                setOpenSong(next);
                                if (next) onEngaged();
                              }}
                            />
                          );
                        })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })
      )}

      {/* Theme card */}
      {theme.title && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: sessions.length * 0.04 + 0.05 }}
          className="bg-forest rounded-3xl p-6 text-cream relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_100%_0%,rgba(201,162,74,0.12),transparent)]" />
          <div className="relative">
            <span className="label-caps text-gold/70 text-[9px]">Tonight&apos;s Theme</span>
            <h3 className="font-display text-2xl font-semibold mt-1 mb-2">{theme.title}</h3>
            {theme.scripture && (
              <p className="text-gold/80 text-sm flex items-center gap-1.5">
                <BookOpen size={12} />
                {theme.scripture}
              </p>
            )}
            {theme.description && (
              <p className="text-cream/60 text-sm mt-3 leading-relaxed">{theme.description}</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Contextual feedback nudge */}
      <AnimatePresence>
        {currentPrompt && !showFeedback && (
          <motion.button
            key={`prompt-${promptIndex}`}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{   opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={() => {
              setShowFeedback(true);
              promptRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="w-full flex items-center gap-3 px-5 py-4 bg-white rounded-3xl border border-forest/15 hover:border-forest/30 hover:bg-forest/3 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-forest/8 flex items-center justify-center flex-shrink-0">
              <currentPrompt.icon size={16} className="text-forest" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-charcoal">{currentPrompt.text}</p>
              <p className="text-[11px] text-charcoal/40 mt-0.5">Tap to share — anonymous or with your name</p>
            </div>
            <MessageSquare size={14} className="text-charcoal/20 flex-shrink-0" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Feedback section */}
      <div ref={promptRef}>
        {showFeedback ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <FeedbackForm eventId={eventId} />
          </motion.div>
        ) : (
          /* Pulsing border button */
          <div className="relative">
            <style>{`
              @keyframes borderPulse {
                0%, 100% { box-shadow: 0 0 0 0 rgba(27,58,42,0.18); }
                50%       { box-shadow: 0 0 0 6px rgba(27,58,42,0); }
              }
            `}</style>
            <button
              onClick={() => setShowFeedback(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full border-2 border-forest/25 text-sm font-medium text-forest/70 hover:border-forest/50 hover:text-forest transition-all"
              style={{ animation: "borderPulse 2.4s ease-in-out infinite" }}
            >
              <MessageSquare size={14} />
              Drop a thought or question
            </button>
          </div>
        )}
      </div>

      {/* Photo sharing */}
      <AttendeePhotoShare slug={slug} />

      {/* Time-based floating nudge toast */}
      <AnimatePresence>
        {showNudge && (
          <motion.div
            key="time-nudge"
            initial={{ opacity: 0, y: 80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{   opacity: 0, y: 80, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-sm z-50"
          >
            <div className="bg-forest rounded-3xl shadow-2xl shadow-forest/30 overflow-hidden border border-forest/20">
              {/* Header strip */}
              <div className="flex items-center justify-between px-5 pt-4 pb-0">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gold/70">Your thoughts matter</span>
                <button
                  onClick={() => dismissNudge()}
                  className="w-6 h-6 rounded-full bg-cream/10 flex items-center justify-center hover:bg-cream/20 transition-colors text-cream/50 hover:text-cream/80 text-xs"
                  aria-label="Dismiss"
                >✕</button>
              </div>

              {/* Body */}
              <div className="px-5 pt-2.5 pb-4">
                <p className="text-cream font-semibold text-sm leading-snug mb-0.5">
                  {FEEDBACK_PROMPTS[0].text}
                </p>
                <p className="text-cream/45 text-xs">
                  Takes 10 seconds. Helps us make every session better.
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={() => dismissNudge(true)}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gold hover:bg-gold-light transition-colors"
              >
                <MessageSquare size={13} className="text-forest" />
                <span className="text-xs font-bold text-forest">Share a thought</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SongRow({
  song,
  vocalist,
  isOpen,
  isActive,
  onToggle,
}: {
  song:     Song;
  vocalist: string | null;
  isOpen:   boolean;
  isActive: boolean;
  onToggle: () => void;
}) {
  const verses = song.lyrics
    ? song.lyrics.split(/\n{2,}/).map(v => v.trim()).filter(Boolean)
    : [];

  return (
    <div className={cn(
      "border-b border-mist last:border-none transition-colors",
      isActive && "bg-forest/4"
    )}>
      <button
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-off-white active:bg-mist/40 transition-colors text-left"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className="relative flex-shrink-0">
          <Music2 size={13} className={cn(isActive ? "text-forest" : "text-charcoal/25")} />
          {isActive && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 border border-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className={cn(
            "text-sm font-medium block truncate",
            isActive ? "text-forest font-semibold" : "text-charcoal"
          )}>
            {song.title}
            {isActive && <span className="ml-2 text-[10px] font-normal text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">now</span>}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {song.artist && <span className="text-[11px] text-charcoal/35 truncate">{song.artist}</span>}
            {song.artist && vocalist && <span className="text-[9px] text-charcoal/20">·</span>}
            {vocalist && (
              <span className={cn(
                "text-[11px] flex items-center gap-1",
                isActive ? "text-forest/70 font-medium" : "text-charcoal/40"
              )}>
                <Mic size={9} />
                {vocalist}
              </span>
            )}
          </div>
        </div>
        {verses.length > 0 && (
          <ChevronDown
            size={15}
            className={cn("text-charcoal/25 transition-transform duration-200 ml-1", isOpen && "rotate-180")}
          />
        )}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && verses.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{   height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 space-y-4">
              {verses.map((verse, vi) => (
                <div key={vi} className={cn(
                  "text-sm text-charcoal/65 leading-7 whitespace-pre-line",
                  vi === 0 && "text-charcoal/80"
                )}>
                  {verse}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
