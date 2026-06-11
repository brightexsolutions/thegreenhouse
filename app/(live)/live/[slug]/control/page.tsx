/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  Tv2, Music, ChevronLeft, ChevronRight, ChevronDown, Clock, Users,
  BookOpen, Heart, Zap, AlignLeft, MessageSquare, Loader2,
  ExternalLink, QrCode, Sun, Moon, Leaf, Images,
  CheckCircle2, X, Sparkles, Play, Eye, Trophy,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type DisplayState = {
  id:                       string;
  event_id:                 string;
  scene:                    string;
  song_id:                  string | null;
  session_song_id:          string | null;
  verse_index:              number;
  custom_text:              string | null;
  theme:                    string;
  show_qr:                  boolean;
  featured_feedback:        string | null;
  featured_feedback_author: string | null;
  trivia_round_id:          string | null;
};

type TriviaQuestion = {
  id:            string;
  question:      string;
  type:          "multiple_choice" | "open_input";
  options:       string[] | null;
  correct_index: number | null;
  category:      string;
  points:        number;
};

type TriviaRound = {
  id:            string;
  status:        "active" | "revealing" | "closed";
  question?:     string;
  type?:         "multiple_choice" | "open_input";
  options?:      string[] | null;
  correct_index?: number | null;
  points?:       number;
  hint?:         string | null;
  timer_seconds?: number | null;
  started_at?:   string;
};

type Song = { id: string; title: string; artist: string | null; lyrics: string | null };

type SessionItem = {
  id:        string;
  vocalist:  string | null;
  item_type: string;
  item_text: string | null;
  songs:     Song | null;
};

type PlannedTrivia = { id: string; question: string; category: string };

type EventData = {
  id:          string;
  title:       string;
  event_date:  string;
  slug:        string;
  event_sessions: Array<{
    id:                 string;
    title:              string;
    sort_order:         number;
    deleted_at:         string | null;
    trivia_question_id: string | null;
    trivia_questions:   PlannedTrivia | null;
    session_songs:      Array<SessionItem>;
  }>;
};

type Feedback = {
  id:          string;
  message:     string;
  author_name: string | null;
  created_at:  string;
};

const SCENES = [
  { key: "branding",    label: "Branding",    icon: Tv2       },
  { key: "countdown",   label: "Countdown",   icon: Clock     },
  { key: "now_playing", label: "Now Playing", icon: Music     },
  { key: "lyrics",      label: "Lyrics",      icon: AlignLeft },
  { key: "program",     label: "Program",     icon: BookOpen  },
  { key: "theme",       label: "Theme",       icon: Zap       },
  { key: "prayer",      label: "Prayer",      icon: Heart     },
  { key: "community",   label: "Community",   icon: Users     },
  { key: "gallery",     label: "Gallery",     icon: Images    },
  { key: "custom",      label: "Custom",      icon: MessageSquare },
  { key: "trivia",      label: "Trivia",      icon: Sparkles  },
] as const;

type SceneKey = typeof SCENES[number]["key"];

const DISPLAY_THEMES: Array<{ key: string; label: string; icon: typeof Sun; bg: string; fg: string }> = [
  { key: "dark",   label: "Dark",   icon: Moon, bg: "#0d1a12", fg: "#c9a24a" },
  { key: "light",  label: "Light",  icon: Sun,  bg: "#f7f2e8", fg: "#1b3a2a" },
  { key: "forest", label: "Forest", icon: Leaf, bg: "#1b3a2a", fg: "#c9a24a" },
];

function getLyricsVerses(lyrics: string | null) {
  if (!lyrics) return [];
  return lyrics.split(/\n{2,}/).map(v => v.trim()).filter(Boolean);
}

export default function ControlPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;

  const supabaseRef = useRef(createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));
  const supabase = supabaseRef.current;

  const [authed,     setAuthed]     = useState<boolean | null>(null);
  const [event,      setEvent]      = useState<EventData | null>(null);
  const [display,    setDisplay]    = useState<DisplayState | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [customText, setCustomText] = useState("");
  const [focusTab,   setFocusTab]   = useState<"all" | "music" | "scenes" | "trivia" | "feedback">("all");
  const [activeSong, setActiveSong] = useState<Song | null>(null);

  // Feedback state
  const [feedback,         setFeedback]        = useState<Feedback[]>([]);
  const [loadingFeedback,  setLoadingFeedback] = useState(false);
  const [projecting,       setProjecting]      = useState<string | null>(null);
  const [feedbackOpen,     setFeedbackOpen]    = useState(true);

  // Trivia state
  const [triviaQuestions,  setTriviaQuestions] = useState<TriviaQuestion[]>([]);
  const [triviaOpen,       setTriviaOpen]      = useState(true);
  const [selectedQId,      setSelectedQId]     = useState<string>("");
  const [triviaRound,      setTriviaRound]     = useState<TriviaRound | null>(null);
  const [triviaCount,      setTriviaCount]     = useState(0);
  const [triviaCorrect,    setTriviaCorrect]   = useState(0);
  const [triviaTimer,      setTriviaTimer]     = useState<number | null>(null);
  const [triviaLoading,    setTriviaLoading]   = useState(false);
  const [usedQIds,         setUsedQIds]        = useState<Set<string>>(new Set());

  // Auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setAuthed(!!user));
  }, []);

  // Shared event loader
  const loadEvent = useCallback(async (isInitial: boolean) => {
    const { data } = await supabase
      .from("events")
      .select("id, title, event_date, slug, event_sessions(id, title, sort_order, deleted_at, trivia_question_id, trivia_questions(id, question, category), session_songs(id, vocalist, item_type, item_text, songs(id, title, artist, lyrics)))")
      .eq("slug", slug)
      .single();
    if (!data) return;
    const ev = data as unknown as EventData;
    ev.event_sessions = ev.event_sessions.filter(s => !s.deleted_at);
    setEvent(ev);
    if (isInitial) {
      const res = await supabase.from("display_state").select("*").eq("event_id", ev.id).maybeSingle();
      if (res?.data) setDisplay(res.data as DisplayState);
    }
  }, [slug]);

  // Load event data once authed
  useEffect(() => {
    if (authed !== true) return;
    loadEvent(true);
  }, [slug, authed, loadEvent]);

  // Re-fetch event every 15s to pick up song/section additions from session manager
  useEffect(() => {
    if (!event) return;
    const id = setInterval(() => loadEvent(false), 15000);
    return () => clearInterval(id);
  }, [event?.id, loadEvent]);

  // Realtime subscription for display_state
  useEffect(() => {
    if (!event) return;
    const channel = supabase
      .channel(`control-${event.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "display_state",
        filter: `event_id=eq.${event.id}`,
      }, (payload) => {
        if (payload.new && Object.keys(payload.new).length > 0) {
          setDisplay(payload.new as DisplayState);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [event?.id]);

  // Sync custom text when scene changes
  useEffect(() => {
    if (display?.custom_text) setCustomText(display.custom_text);
  }, [display?.scene]);

  // Sync active song
  useEffect(() => {
    if (!display?.song_id || !event) { setActiveSong(null); return; }
    const allSongs: Song[] = [];
    for (const sess of event.event_sessions) for (const ss of sess.session_songs) if (ss.songs) allSongs.push(ss.songs);
    setActiveSong(allSongs.find(s => s.id === display.song_id) ?? null);
  }, [display?.song_id, event]);

  // Poll feedback every 10s
  useEffect(() => {
    if (!event) return;
    async function loadFeedback() {
      if (!event) return;
      setLoadingFeedback(true);
      const res = await fetch(`/api/live-feedback?event_id=${event.id}`);
      if (res.ok) {
        const data = await res.json() as { feedback: Feedback[] };
        setFeedback(data.feedback);
      }
      setLoadingFeedback(false);
    }
    loadFeedback();
    const id = setInterval(loadFeedback, 10000);
    return () => clearInterval(id);
  }, [event?.id]);

  const loadUsedQIds = useCallback(async (eventId: string) => {
    try {
      const res = await fetch(`/api/admin/trivia/rounds?event_id=${eventId}`);
      if (!res.ok) return;
      const d = await res.json() as { rounds: Array<{ question_id: string }> };
      setUsedQIds(new Set(d.rounds.map(r => r.question_id)));
    } catch { /* ignore */ }
  }, []);

  // Load trivia question library + used question history once authed
  useEffect(() => {
    if (authed !== true || !event) return;
    fetch("/api/admin/trivia")
      .then(r => r.json())
      .then((d: { questions: TriviaQuestion[] }) => {
        setTriviaQuestions(d.questions ?? []);
        if (d.questions?.[0]) setSelectedQId(d.questions[0].id);
      })
      .catch(() => {});
    loadUsedQIds(event.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, event?.id]);

  // Sync trivia round from display_state + poll results
  useEffect(() => {
    const roundId = display?.trivia_round_id;
    if (!roundId) { setTriviaRound(null); setTriviaCount(0); setTriviaCorrect(0); return; }
    let cancelled = false;
    async function pollRound() {
      const [rRes, resRes] = await Promise.all([
        fetch(`/api/trivia/${roundId}`),
        fetch(`/api/trivia/${roundId}/results`),
      ]);
      if (cancelled) return;
      if (rRes.ok)   setTriviaRound(await rRes.json() as TriviaRound);
      if (resRes.ok) {
        const d = await resRes.json() as { total: number; correct: number };
        setTriviaCount(d.total);
        setTriviaCorrect(d.correct);
      }
    }
    pollRound();
    const id = setInterval(pollRound, 4000);
    return () => { cancelled = true; clearInterval(id); };
  }, [display?.trivia_round_id]);

  async function startTriviaRound() {
    if (!event || !selectedQId) return;
    setTriviaLoading(true);
    const res = await fetch("/api/admin/trivia/rounds", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ event_id: event.id, question_id: selectedQId, timer_seconds: triviaTimer }),
    });
    if (res.ok) {
      const data = await res.json() as { round: TriviaRound };
      setTriviaRound(data.round);
      // Realtime will update display; also refresh locally
      await new Promise(r => setTimeout(r, 200));
      await loadEvent(false);
    }
    setTriviaLoading(false);
  }

  async function patchTriviaRound(action: "reveal" | "close") {
    const roundId = display?.trivia_round_id ?? triviaRound?.id;
    if (!roundId) return;
    setTriviaLoading(true);
    const res = await fetch(`/api/admin/trivia/rounds/${roundId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action }),
    });
    if (res.ok) {
      // Refresh round state so control reflects new status
      const { data: rd } = await supabase
        .from("trivia_rounds")
        .select("id, status, question_id, trivia_questions(question, type, options, correct_index, points, hint)")
        .eq("id", roundId)
        .single();
      if (rd) {
        type TQ = { question: string; type: string; options: string[] | null; correct_index: number | null; points: number; hint: string | null };
        const tq = (Array.isArray(rd.trivia_questions) ? rd.trivia_questions[0] : rd.trivia_questions) as TQ | null;
        setTriviaRound({
        id:            rd.id,
        status:        rd.status as "active" | "revealing" | "closed",
        question:      tq?.question ?? "",
        type:          (tq?.type ?? "multiple_choice") as "multiple_choice" | "open_input",
        options:       tq?.options ?? null,
        correct_index: tq?.correct_index ?? null,
        points:        tq?.points ?? 10,
        hint:          tq?.hint ?? null,
        timer_seconds: null,
        started_at:    "",
        });
      }
    }
    setTriviaLoading(false);
  }

  async function dismissTrivia() {
    const roundId = display?.trivia_round_id ?? triviaRound?.id;
    if (!roundId || !event) return;
    setTriviaLoading(true);
    await fetch(`/api/admin/trivia/rounds/${roundId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action: "dismiss" }),
    });
    setTriviaRound(null);
    setTriviaCount(0);
    setTriviaCorrect(0);
    const { data } = await supabase.from("display_state").select("*").eq("event_id", event.id).maybeSingle();
    if (data) setDisplay(data as DisplayState);
    loadUsedQIds(event.id);
    setTriviaLoading(false);
  }

  async function finalizeTrivia() {
    const roundId = display?.trivia_round_id ?? triviaRound?.id;
    if (!roundId || !event) return;
    setTriviaLoading(true);
    await fetch(`/api/admin/trivia/rounds/${roundId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action: "finalize", event_id: event.id }),
    });
    setTriviaRound(null);
    setTriviaCount(0);
    setTriviaCorrect(0);
    const { data } = await supabase.from("display_state").select("*").eq("event_id", event.id).maybeSingle();
    if (data) setDisplay(data as DisplayState);
    loadUsedQIds(event.id);
    setTriviaLoading(false);
  }

  async function upsertDisplay(patch: Partial<DisplayState>) {
    if (!event || !display) return;
    setSaving(true);
    const updated = { ...display, ...patch };
    const { data } = await supabase.from("display_state").upsert({
      id:                       display.id,
      event_id:                 event.id,
      scene:                    updated.scene,
      song_id:                  updated.song_id,
      session_song_id:          updated.session_song_id ?? null,
      verse_index:              updated.verse_index,
      custom_text:              updated.custom_text,
      theme:                    updated.theme ?? "dark",
      show_qr:                  updated.show_qr ?? false,
      featured_feedback:        updated.featured_feedback ?? null,
      featured_feedback_author: updated.featured_feedback_author ?? null,
      updated_at:               new Date().toISOString(),
    }, { onConflict: "event_id" }).select("*").single();
    if (data) setDisplay(data as DisplayState);
    setSaving(false);
  }

  async function initDisplay() {
    if (!event) return;
    setSaving(true);
    const { data } = await supabase
      .from("display_state")
      .upsert({
        event_id: event.id, scene: "branding", song_id: null,
        verse_index: 0, custom_text: null, theme: "dark", show_qr: false,
        featured_feedback: null, featured_feedback_author: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "event_id" })
      .select("*")
      .single();
    if (data) setDisplay(data as DisplayState);
    setSaving(false);
  }

  async function setScene(scene: SceneKey)   { await upsertDisplay({ scene, verse_index: 0 }); }
  async function setSong(songId: string, sessionSongId: string) {
    if (display?.session_song_id === sessionSongId) {
      await upsertDisplay({ song_id: null, session_song_id: null, verse_index: 0 });
    } else {
      await upsertDisplay({ song_id: songId, session_song_id: sessionSongId, verse_index: 0, scene: "lyrics" });
    }
  }

  async function setTextItem(sessionSongId: string, text: string) {
    if (display?.session_song_id === sessionSongId) {
      await upsertDisplay({ session_song_id: null, custom_text: null });
    } else {
      await upsertDisplay({ session_song_id: sessionSongId, song_id: null, custom_text: text, scene: "custom", verse_index: 0 });
    }
  }
  async function nextVerse() {
    const verses = getLyricsVerses(activeSong?.lyrics ?? null);
    await upsertDisplay({ verse_index: Math.min((display?.verse_index ?? 0) + 1, verses.length - 1) });
  }
  async function prevVerse() {
    await upsertDisplay({ verse_index: Math.max((display?.verse_index ?? 0) - 1, 0) });
  }
  async function pushCustom()            { await upsertDisplay({ custom_text: customText, scene: "custom" }); }
  async function panic()                 { await upsertDisplay({ scene: "branding", featured_feedback: null }); }
  async function setTheme(theme: string) { await upsertDisplay({ theme }); }
  async function toggleQr()              { await upsertDisplay({ show_qr: !display?.show_qr }); }

  async function projectFeedback(message: string, authorName: string | null) {
    setProjecting(message);
    await upsertDisplay({ featured_feedback: message, featured_feedback_author: authorName });
    setProjecting(null);
  }

  async function dismissFeedback() {
    await upsertDisplay({ featured_feedback: null, featured_feedback_author: null });
  }

  if (authed === null) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-forest/40" />
      </div>
    );
  }

  if (authed === false) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-sm text-charcoal/60 mb-4">Admin login required to use the control panel</p>
          <Link
            href={`/admin/login?redirect=/live/${slug}/control`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-cream text-sm font-medium"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-forest/40" />
      </div>
    );
  }

  const allSongs: Song[] = [];
  for (const sess of [...event.event_sessions].sort((a, b) => a.sort_order - b.sort_order)) {
    for (const ss of sess.session_songs) {
      if (ss.songs && !allSongs.find(s => s.id === ss.songs!.id)) allSongs.push(ss.songs);
    }
  }
  const verses = getLyricsVerses(activeSong?.lyrics ?? null);

  return (
    <div className="min-h-screen bg-forest text-cream max-w-md mx-auto px-4 py-5 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-cream/40 text-xs uppercase tracking-wider">Control Panel</p>
          <h1 className="font-display text-xl font-semibold text-cream">{event.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {saving && <Loader2 size={14} className="animate-spin text-cream/40" />}
          <a href={`/live/${event.slug}/display`} target="_blank" rel="noopener"
            className="p-2 rounded-xl bg-cream/10 hover:bg-cream/20 transition-colors">
            <ExternalLink size={14} className="text-cream/60" />
          </a>
        </div>
      </div>

      {/* Current scene chip */}
      <div className="bg-cream/10 rounded-2xl px-4 py-3 mb-4 flex items-center justify-between">
        <span className="text-xs text-cream/50">Current scene</span>
        <span className="text-sm font-semibold text-gold uppercase tracking-wider">{display?.scene ?? "—"}</span>
      </div>

      {/* Focus tabs — each person can focus on their area */}
      <div className="flex items-center gap-1 mb-5 bg-cream/8 rounded-2xl p-1">
        {([
          { key: "all",      label: "General",  badge: false },
          { key: "music",    label: "Music",    badge: false },
          { key: "scenes",   label: "Scenes",   badge: false },
          { key: "trivia",   label: "Trivia",   badge: triviaRound?.status === "active" },
          { key: "feedback", label: "Feedback", badge: feedback.length > 0 },
        ] as const).map(({ key, label, badge }) => (
          <button
            key={key}
            onClick={() => setFocusTab(key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all",
              focusTab === key
                ? "bg-gold text-forest shadow-sm"
                : "text-cream/45 hover:text-cream/70"
            )}
          >
            {label}
            {badge && focusTab !== key && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Active feedback chip */}
      {display?.featured_feedback && (
        <div className="bg-gold/15 border border-gold/25 rounded-2xl px-4 py-3 mb-4 flex items-center justify-between gap-3">
          <p className="text-xs text-gold/80 truncate flex-1">Projecting: &ldquo;{display.featured_feedback}&rdquo;</p>
          <button onClick={dismissFeedback} disabled={saving}
            className="p-1.5 rounded-lg bg-cream/10 hover:bg-cream/20 transition-colors flex-shrink-0">
            <X size={11} className="text-cream/50" />
          </button>
        </div>
      )}

      {/* Init display state if not set */}
      {!display && (
        <button onClick={initDisplay} disabled={saving}
          className="w-full py-3 rounded-2xl bg-gold text-forest font-semibold text-sm mb-4 disabled:opacity-50">
          {saving ? "Initialising…" : "Initialise display"}
        </button>
      )}

      {display && (
        <>
          {/* Scene switcher */}
          {(focusTab === "all" || focusTab === "scenes") && (
          <section className="mb-5">
            <h2 className="text-xs text-cream/40 uppercase tracking-wider mb-3">Scenes</h2>
            <div className="grid grid-cols-3 gap-2">
              {SCENES.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setScene(key)} disabled={saving}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl text-xs font-medium transition-all ${
                    display.scene === key ? "bg-gold text-forest" : "bg-cream/10 text-cream/60 hover:bg-cream/20"
                  }`}>
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </section>
          )}

          {/* Program — session + song navigation */}
          {(focusTab === "all" || focusTab === "music") && (
          <section className="mb-5">
            <h2 className="text-xs text-cream/40 uppercase tracking-wider mb-3">Program</h2>
            {event.event_sessions.length === 0 ? (
              <p className="text-cream/30 text-xs text-center py-4">No program built yet</p>
            ) : (
              <div className="space-y-2">
                {[...event.event_sessions]
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map(sess => {
                    const sessIsActive = sess.session_songs.some(ss => ss.id === display.session_song_id);
                    return (
                      <div key={sess.id} className={`rounded-2xl overflow-hidden border transition-all ${
                        sessIsActive ? "border-gold/40" : "border-cream/10"
                      }`}>
                        {/* Session header */}
                        <div className={`px-3 py-2 flex items-center gap-2 text-xs font-semibold ${
                          sessIsActive ? "bg-gold/15 text-gold" : "bg-cream/8 text-cream/50"
                        }`}>
                          <Music size={10} />
                          {sess.title}
                          {sessIsActive && <span className="ml-auto text-[9px] uppercase tracking-wider text-gold/70">active</span>}
                        </div>
                        {/* Program items in session */}
                        {sess.session_songs.length === 0 ? (
                          <div className="px-3 py-2 text-[10px] text-cream/20">No items</div>
                        ) : (
                          sess.session_songs.map((ss) => {
                            const isActive = ss.id === display.session_song_id;
                            const isTextItem = ss.item_type !== "song";

                            if (isTextItem) {
                              return (
                                <button
                                  key={ss.id}
                                  onClick={() => setTextItem(ss.id, ss.item_text ?? "")}
                                  disabled={saving || !ss.item_text}
                                  className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all text-left border-t border-cream/5 ${
                                    isActive ? "bg-blue-400/20 text-blue-200" : "text-cream/60 hover:bg-cream/10 hover:text-cream"
                                  }`}
                                >
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    isActive ? "bg-blue-400/40" : "bg-cream/10"
                                  }`}>
                                    <MessageSquare size={9} className={isActive ? "text-blue-200" : "text-cream/30"} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">{ss.item_text}</p>
                                    <p className="text-[10px] text-cream/30 capitalize">{ss.item_type}</p>
                                  </div>
                                  {isActive && <span className="text-[9px] text-blue-300/70 uppercase tracking-wide flex-shrink-0">on</span>}
                                </button>
                              );
                            }

                            const song = ss.songs;
                            if (!song) return null;
                            return (
                              <button
                                key={ss.id}
                                onClick={() => setSong(song.id, ss.id)}
                                disabled={saving}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all text-left border-t border-cream/5 ${
                                  isActive ? "bg-gold/20 text-gold" : "text-cream/70 hover:bg-cream/10 hover:text-cream"
                                }`}
                              >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  isActive ? "bg-gold text-forest" : "bg-cream/10"
                                }`}>
                                  {isActive
                                    ? <Music size={10} className="text-forest" />
                                    : <span className="text-[9px] text-cream/30">▶</span>
                                  }
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">{song.title}</p>
                                  <div className="flex items-center gap-1.5">
                                    {song.artist && <p className="text-[10px] text-cream/35 truncate">{song.artist}</p>}
                                    {song.artist && ss.vocalist && <span className="text-[9px] text-cream/15">·</span>}
                                    {ss.vocalist && <p className="text-[10px] text-gold/60 truncate">{ss.vocalist}</p>}
                                  </div>
                                </div>
                                {isActive && <span className="text-[9px] text-gold/70 uppercase tracking-wide flex-shrink-0">now</span>}
                              </button>
                            );
                          })
                        )}
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Verse navigation — shown when a song is active */}
            {activeSong && verses.length > 0 && (
              <div className="mt-3 bg-cream/8 rounded-2xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gold/70 font-semibold truncate">{activeSong.title}</p>
                  <span className="text-[10px] text-cream/30 tabular-nums flex-shrink-0 ml-2">
                    {display.verse_index + 1}/{verses.length}
                  </span>
                </div>
                <div className="bg-cream/5 rounded-xl p-2.5 mb-3 text-xs text-cream/50 min-h-[48px] whitespace-pre-line leading-relaxed">
                  {verses[display.verse_index] ?? "—"}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={prevVerse} disabled={saving || display.verse_index === 0}
                    className="flex-1 py-2.5 rounded-xl bg-cream/10 hover:bg-cream/20 disabled:opacity-30 flex items-center justify-center gap-2 text-xs font-medium transition-colors">
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button onClick={nextVerse} disabled={saving || display.verse_index >= verses.length - 1}
                    className="flex-1 py-2.5 rounded-xl bg-cream/10 hover:bg-cream/20 disabled:opacity-30 flex items-center justify-center gap-2 text-xs font-medium transition-colors">
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </section>
          )}

          {/* Custom text */}
          {(focusTab === "all" || focusTab === "scenes") && (
          <section className="mb-5">
            <h2 className="text-xs text-cream/40 uppercase tracking-wider mb-3">Custom text</h2>
            <textarea value={customText} onChange={e => setCustomText(e.target.value)} rows={3}
              placeholder="Type any text to push to the display…"
              className="w-full bg-cream/10 border border-cream/10 rounded-xl px-3 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold resize-none" />
            <button onClick={pushCustom} disabled={!customText.trim() || saving}
              className="w-full mt-2 py-3 rounded-xl bg-cream/15 hover:bg-cream/25 text-cream text-sm font-medium disabled:opacity-40 transition-colors">
              Push to display
            </button>
          </section>
          )}

          {/* Attendee feedback */}
          {(focusTab === "all" || focusTab === "feedback") && (
          <section className="mb-5">
            {focusTab === "all" ? (
              <button
                onClick={() => setFeedbackOpen(o => !o)}
                className="w-full flex items-center justify-between mb-3 group"
              >
                <h2 className="text-xs text-cream/40 uppercase tracking-wider">Attendee feedback</h2>
                <div className="flex items-center gap-2">
                  {loadingFeedback && <Loader2 size={12} className="animate-spin text-cream/30" />}
                  {!loadingFeedback && feedback.length > 0 && (
                    <span className="text-[10px] text-gold/70 bg-gold/15 px-2 py-0.5 rounded-full">{feedback.length}</span>
                  )}
                  <ChevronDown size={13} className={`text-cream/30 transition-transform duration-200 ${feedbackOpen ? "rotate-180" : ""}`} />
                </div>
              </button>
            ) : (
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs text-cream/40 uppercase tracking-wider">Attendee feedback</h2>
                <div className="flex items-center gap-2">
                  {loadingFeedback && <Loader2 size={12} className="animate-spin text-cream/30" />}
                  {!loadingFeedback && feedback.length > 0 && (
                    <span className="text-[10px] text-gold/70 bg-gold/15 px-2 py-0.5 rounded-full">{feedback.length}</span>
                  )}
                </div>
              </div>
            )}

            {(focusTab === "feedback" || feedbackOpen) && (
              feedback.length === 0 ? (
                <p className="text-cream/25 text-xs text-center py-4">No feedback yet</p>
              ) : (
                <div className={`space-y-2 overflow-y-auto ${focusTab === "feedback" ? "" : "max-h-60"}`}>
                  {feedback.map((fb) => (
                    <div key={fb.id} className="bg-cream/8 rounded-xl p-3 flex items-start gap-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-cream/80 leading-relaxed">&ldquo;{fb.message}&rdquo;</p>
                        {fb.author_name && (
                          <p className="text-[10px] text-cream/35 mt-1">— {fb.author_name}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => projectFeedback(fb.message, fb.author_name)}
                          disabled={saving || projecting === fb.message}
                          title="Project on display"
                          className={`p-1.5 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1 ${
                            display.featured_feedback === fb.message
                              ? "bg-gold/30 text-gold"
                              : "bg-cream/15 text-cream/50 hover:bg-gold/20 hover:text-gold"
                          }`}
                        >
                          {projecting === fb.message
                            ? <Loader2 size={10} className="animate-spin" />
                            : display.featured_feedback === fb.message
                              ? <CheckCircle2 size={10} />
                              : <Tv2 size={10} />
                          }
                        </button>
                        {display.featured_feedback === fb.message && (
                          <button
                            onClick={dismissFeedback}
                            disabled={saving}
                            title="Remove from display"
                            className="p-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </section>
          )}

          {/* Trivia */}
          {(focusTab === "all" || focusTab === "trivia") && (
          <section className="mb-5">
            <button
              onClick={() => setTriviaOpen(o => !o)}
              className="w-full flex items-center justify-between mb-3 group"
            >
              <h2 className="text-xs text-cream/40 uppercase tracking-wider">Trivia</h2>
              <div className="flex items-center gap-2">
                {triviaRound && triviaRound.status === "active" && (
                  <span className="flex items-center gap-1 text-[10px] text-green-300 bg-green-500/20 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Live · {triviaCount}
                  </span>
                )}
                {triviaRound && triviaRound.status === "revealing" && (
                  <span className="text-[10px] text-gold/70 bg-gold/15 px-2 py-0.5 rounded-full">Revealing</span>
                )}
                {triviaRound && triviaRound.status === "closed" && (
                  <span className="text-[10px] text-gold font-bold bg-gold/20 px-2 py-0.5 rounded-full">🏆 Leaderboard</span>
                )}
                <ChevronDown size={13} className={`text-cream/30 transition-transform duration-200 ${triviaOpen ? "rotate-180" : ""}`} />
              </div>
            </button>

            {triviaOpen && (
              <div className="space-y-3">
                {/* Active / revealing round controls */}
                {triviaRound && triviaRound.status === "closed" ? (
                  /* Leaderboard showing — next question or end trivia */
                  <div className="bg-gold/10 border border-gold/25 rounded-2xl p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏆</span>
                      <div>
                        <p className="text-xs font-semibold text-gold">Round complete</p>
                        <p className="text-[10px] text-cream/40 mt-0.5">
                          {triviaCount} played · {triviaCorrect} correct
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={dismissTrivia}
                        disabled={triviaLoading}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-cream/15 text-cream/70 hover:bg-cream/25 text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <Play size={12} /> Next question
                      </button>
                      <button
                        onClick={finalizeTrivia}
                        disabled={triviaLoading}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gold text-forest hover:bg-gold-light text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        {triviaLoading ? <Loader2 size={12} className="animate-spin" /> : <Trophy size={12} />}
                        Final leaderboard
                      </button>
                    </div>
                  </div>
                ) : triviaRound && ["active", "revealing"].includes(triviaRound.status) ? (
                  <div className="bg-cream/8 rounded-2xl p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gold">Round in progress</p>
                        <p className="text-[10px] text-cream/40 mt-0.5">
                          {triviaCount} answered · {triviaCorrect} correct
                        </p>
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                        triviaRound.status === "active" ? "bg-green-500/20 text-green-300" : "bg-gold/20 text-gold"
                      }`}>
                        {triviaRound.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {triviaRound.status === "active" && (
                        <button
                          onClick={() => patchTriviaRound("reveal")}
                          disabled={triviaLoading}
                          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gold/20 text-gold hover:bg-gold/30 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          <Eye size={12} /> Reveal answer
                        </button>
                      )}
                      <button
                        onClick={() => patchTriviaRound("close")}
                        disabled={triviaLoading}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 ${
                          triviaRound.status === "active"
                            ? "bg-green-500/20 text-green-300 hover:bg-green-500/30"
                            : "col-span-2 bg-gold text-forest hover:bg-gold-light"
                        }`}
                      >
                        <Trophy size={12} />
                        {triviaRound.status === "active" ? "End & show results" : "Show leaderboard"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Launch controls */
                  <div className="space-y-2">
                    {triviaQuestions.length === 0 ? (
                      <p className="text-[11px] text-cream/30 text-center py-3">
                        No trivia questions yet — add some in Library → Trivia
                      </p>
                    ) : (
                      <>
                        <select
                          value={selectedQId}
                          onChange={e => setSelectedQId(e.target.value)}
                          className="w-full bg-cream/10 border border-cream/10 rounded-xl px-3 py-2.5 text-xs text-cream focus:outline-none focus:border-gold"
                        >
                          {triviaQuestions.map(q => {
                            const played = usedQIds.has(q.id);
                            const label  = q.question.length > 50 ? q.question.slice(0, 50) + "…" : q.question;
                            return (
                              <option key={q.id} value={q.id} className="bg-forest text-cream">
                                {played ? "✓ " : ""}{label} [{q.category}]
                              </option>
                            );
                          })}
                        </select>
                        {selectedQId && usedQIds.has(selectedQId) && (
                          <p className="text-[10px] text-gold/50">This question was already played this event.</p>
                        )}

                        {/* Optional timer */}
                        <div className="flex items-center gap-2">
                          <select
                            value={triviaTimer ?? ""}
                            onChange={e => setTriviaTimer(e.target.value ? parseInt(e.target.value) : null)}
                            className="flex-1 bg-cream/10 border border-cream/10 rounded-xl px-3 py-2 text-xs text-cream focus:outline-none focus:border-gold"
                          >
                            <option value="">No timer</option>
                            <option value="30">30 seconds</option>
                            <option value="45">45 seconds</option>
                            <option value="60">1 minute</option>
                            <option value="90">90 seconds</option>
                            <option value="120">2 minutes</option>
                          </select>
                          <button
                            onClick={startTriviaRound}
                            disabled={triviaLoading || !selectedQId}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold text-forest text-xs font-bold hover:bg-gold-light transition-colors disabled:opacity-50"
                          >
                            {triviaLoading ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                            Launch
                          </button>
                        </div>
                        <p className="text-[10px] text-cream/20 leading-relaxed">
                          Launching switches the display to Trivia scene and opens answering for attendees.
                        </p>

                        {/* Planned trivia per section */}
                        {event && event.event_sessions.some(s => s.trivia_question_id) && (
                          <div className="mt-3 pt-3 border-t border-cream/10">
                            <p className="text-[10px] text-cream/35 uppercase tracking-wider mb-2">Planned for this event</p>
                            <div className="space-y-1.5">
                              {event.event_sessions
                                .filter(s => s.trivia_question_id && s.trivia_questions)
                                .map(s => {
                                  const q     = s.trivia_questions!;
                                  const played = usedQIds.has(s.trivia_question_id!);
                                  return (
                                    <div key={s.id} className="flex items-center gap-2 bg-cream/6 rounded-xl px-3 py-2">
                                      <div className="flex-1 min-w-0">
                                        <p className={cn("text-[10px] font-medium truncate", played ? "text-cream/30 line-through" : "text-cream/70")}>
                                          {s.title}
                                        </p>
                                        <p className="text-[9px] text-cream/35 truncate">{q.question}</p>
                                      </div>
                                      {played ? (
                                        <span className="text-[9px] text-gold/40 flex-shrink-0">played</span>
                                      ) : (
                                        <button
                                          onClick={() => { setSelectedQId(s.trivia_question_id!); }}
                                          className="text-[10px] font-semibold text-gold hover:text-gold-light flex-shrink-0 transition-colors"
                                        >
                                          Select →
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
          )}

          {/* Display theme */}
          {(focusTab === "all" || focusTab === "scenes") && (
          <section className="mb-5">
            <h2 className="text-xs text-cream/40 uppercase tracking-wider mb-3">Display theme</h2>
            <div className="grid grid-cols-3 gap-2">
              {DISPLAY_THEMES.map(({ key, label, icon: Icon, bg, fg }) => (
                <button key={key} onClick={() => setTheme(key)} disabled={saving}
                  className="flex flex-col items-center gap-2 py-3 px-2 rounded-2xl text-xs font-medium transition-all border"
                  style={{
                    background:   (display.theme ?? "dark") === key ? bg : "rgba(247,242,232,0.08)",
                    borderColor:  (display.theme ?? "dark") === key ? fg : "rgba(247,242,232,0.08)",
                    color:        (display.theme ?? "dark") === key ? fg : "rgba(247,242,232,0.5)",
                  }}>
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          </section>
          )}


        </>
      )}

      {/* FAB bar — panic + QR toggle always visible at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-md mx-auto px-4 pb-4 pt-6 bg-gradient-to-t from-forest via-forest/95 to-transparent pointer-events-auto flex items-center gap-2">
          <button onClick={panic} disabled={saving}
            className="flex-1 py-3.5 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-semibold hover:bg-red-500/30 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg">
            ⚡ Back to branding
          </button>
          {display && (
            <button onClick={toggleQr} disabled={saving}
              title={display.show_qr ? "Hide QR" : "Show QR on display"}
              className={`flex-shrink-0 px-4 py-3.5 rounded-2xl border text-sm font-semibold transition-all disabled:opacity-50 shadow-lg flex items-center gap-1.5 ${
                display.show_qr
                  ? "bg-gold/25 border-gold/40 text-gold"
                  : "bg-cream/10 border-cream/15 text-cream/55 hover:bg-cream/20"
              }`}>
              <QrCode size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
