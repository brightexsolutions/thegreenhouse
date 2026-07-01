/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  Tv2, Music, ChevronLeft, ChevronRight, ChevronDown, Clock, Users,
  BookOpen, Heart, Zap, AlignLeft, MessageSquare, Loader2,
  ExternalLink, QrCode, Sun, Moon, Leaf, Images,
  CheckCircle2, X, Sparkles, Play, Eye, Trophy, Film,
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

type Song = { id: string; title: string; artist: string | null; lyrics: string | null; key: string | null };

type SessionItem = {
  id:        string;
  vocalist:  string | null;
  item_type: string;
  item_text: string | null;
  songs:     Song | null;
};

type PlannedTrivia  = { id: string; question: string; category: string };
type OpenResponse   = { id: string; attendee_name: string | null; answer_text: string; is_correct: boolean | null };

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
  { key: "highlight",   label: "Highlight",   icon: Film      },
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
  // Read ?t= token from URL (only on client)
  const controlToken = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("t")
    : null;

  const supabaseRef = useRef(createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));
  const supabase = supabaseRef.current;

  const [authed,          setAuthed]         = useState<boolean | null>(null);
  const [permissions,     setPermissions]    = useState<string[]>([]);
  const [event,           setEvent]          = useState<EventData | null>(null);
  const [display,         setDisplay]        = useState<DisplayState | null>(null);
  const [saving,          setSaving]         = useState(false);
  const [saveError,       setSaveError]      = useState(false);
  const [customText,      setCustomText]     = useState("");
  const [focusTab,        setFocusTab]       = useState<"all" | "music" | "scenes" | "trivia" | "feedback">("all");
  const [openSection,     setOpenSection]    = useState<string>("music");
  const [openSessionId,   setOpenSessionId]  = useState<string | null>(null);
  const [activeSong,      setActiveSong]     = useState<Song | null>(null);
  const [realtimeStatus,  setRealtimeStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

  // Feedback state
  const [feedback,         setFeedback]        = useState<Feedback[]>([]);
  const [loadingFeedback,  setLoadingFeedback] = useState(false);
  const [projecting,       setProjecting]      = useState<string | null>(null);

  // Trivia state
  const [triviaQuestions,  setTriviaQuestions] = useState<TriviaQuestion[]>([]);
  const [selectedQId,      setSelectedQId]     = useState<string>("");
  const [triviaRound,      setTriviaRound]     = useState<TriviaRound | null>(null);
  const [triviaCount,      setTriviaCount]     = useState(0);
  const [triviaCorrect,    setTriviaCorrect]   = useState(0);
  const [triviaTimer,      setTriviaTimer]     = useState<number | null>(null);
  const [triviaLoading,    setTriviaLoading]   = useState(false);
  const [usedQIds,         setUsedQIds]        = useState<Set<string>>(new Set());

  // Open-input response scoring
  const [openResponses,   setOpenResponses]   = useState<OpenResponse[]>([]);
  const [localScores,     setLocalScores]     = useState<Record<string, boolean | null>>({});
  const [openKeywords,    setOpenKeywords]    = useState<string | null>(null);
  const [scoringLoading,  setScoringLoading]  = useState(false);
  const [scoringSaved,    setScoringSaved]    = useState(false);

  const hasPermission = useCallback((permission: string) => {
    if (permissions.includes("full")) return true;
    return permissions.includes(permission);
  }, [permissions]);

  // Auth check — control token first, then admin session fallback
  useEffect(() => {
    async function checkAuth() {
      const t = new URLSearchParams(window.location.search).get("t");
      if (t) {
        try {
          const res = await fetch(`/api/live/${slug}/control-access?t=${encodeURIComponent(t)}`);
          if (res.ok) {
            const data = await res.json() as { valid: boolean; permissions?: string[] };
            setAuthed(data.valid);
            if (data.valid) {
              setPermissions(data.permissions ?? ["full"]);
              return;
            }
          }
          setAuthed(false);
          setPermissions([]);
          return;
        } catch {
          setAuthed(false);
          setPermissions([]);
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAuthed(true);
        setPermissions(["full"]);
        return;
      }

      setAuthed(false);
      setPermissions([]);
    }
    checkAuth();
  }, [slug, supabase.auth]);

  // Auto-set focusTab to first allowed tab when permissions are scoped
  useEffect(() => {
    if (permissions.includes("full")) return;
    const validKeys = ["music", "scenes", "trivia", "feedback"];
    const first = permissions.find(p => validKeys.includes(p));
    if (first) setFocusTab(first as typeof focusTab);
  }, [permissions]);

  // Auto-open the relevant section when switching tabs
  useEffect(() => {
    if (focusTab !== "all") setOpenSection(focusTab);
  }, [focusTab]);

  // Shared event loader
  const loadEvent = useCallback(async (isInitial: boolean) => {
    const { data } = await supabase
      .from("events")
      .select("id, title, event_date, slug, event_sessions(id, title, sort_order, deleted_at, trivia_question_id, trivia_questions(id, question, category), session_songs(id, vocalist, item_type, item_text, songs(id, title, artist, lyrics, key)))")
      .eq("slug", slug)
      .single();
    if (!data) return;
    const ev = data as unknown as EventData;
    ev.event_sessions = ev.event_sessions.filter(s => !s.deleted_at);
    setEvent(ev);
    if (isInitial) {
      const res = await supabase.from("display_state").select("*").eq("event_id", ev.id).maybeSingle();
      if (res?.data) setDisplay(res.data as DisplayState);
      const sorted = [...ev.event_sessions].sort((a, b) => a.sort_order - b.sort_order);
      if (sorted[0]) setOpenSessionId(sorted[0].id);
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
    setRealtimeStatus("connecting");
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
      .subscribe((status) => {
        if (status === "SUBSCRIBED")    setRealtimeStatus("connected");
        if (status === "CLOSED" || status === "CHANNEL_ERROR") setRealtimeStatus("disconnected");
      });
    return () => { supabase.removeChannel(channel); };
  }, [event?.id]);

  // Polling fallback: keep display state fresh every 5s (critical when Realtime is disconnected)
  useEffect(() => {
    if (!event) return;
    let cancelled = false;
    const id = setInterval(async () => {
      const { data } = await supabase.from("display_state").select("*").eq("event_id", event.id).maybeSingle();
      if (!cancelled && data) setDisplay(data as DisplayState);
    }, 5000);
    return () => { cancelled = true; clearInterval(id); };
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

  // Load open_input responses when round is revealing / closed
  useEffect(() => {
    const roundId = triviaRound?.id;
    if (!roundId || triviaRound?.type !== "open_input" || !["revealing", "closed"].includes(triviaRound.status)) {
      setOpenResponses([]);
      setLocalScores({});
      setOpenKeywords(null);
      return;
    }
    let cancelled = false;
    async function load() {
      const res = await fetch(`/api/admin/trivia/rounds/${roundId}`);
      if (!res.ok || cancelled) return;
      const d = await res.json() as { round: { trivia_questions: unknown }; responses: OpenResponse[]; correctCount: number };
      if (cancelled) return;
      setOpenResponses(d.responses ?? []);
      setTriviaCorrect(d.correctCount ?? 0);
      const tq = (Array.isArray(d.round?.trivia_questions) ? d.round.trivia_questions[0] : d.round?.trivia_questions) as { answer_keywords?: string | null; correct_answer?: string | null } | null;
      setOpenKeywords(tq?.answer_keywords ?? tq?.correct_answer ?? null);
      setLocalScores(prev => {
        if (Object.keys(prev).length > 0) return prev;
        const init: Record<string, boolean | null> = {};
        for (const r of d.responses ?? []) init[r.id] = r.is_correct;
        return init;
      });
    }
    load();
    const id = setInterval(load, 8000);
    return () => { cancelled = true; clearInterval(id); };
  }, [triviaRound?.id, triviaRound?.type, triviaRound?.status]);

  function applyKeywordDetection() {
    if (!openKeywords) return;
    const kws = openKeywords.split(",").map(k => k.trim().toLowerCase()).filter(Boolean);
    setLocalScores(prev => {
      const next = { ...prev };
      for (const r of openResponses) {
        const text = r.answer_text.toLowerCase();
        if (kws.every(k => text.includes(k))) next[r.id] = true;
      }
      return next;
    });
  }

  async function saveOpenScores() {
    const roundId = triviaRound?.id;
    if (!roundId) return;
    setScoringLoading(true);
    const scores = Object.entries(localScores)
      .filter(([, v]) => v !== null)
      .map(([id, is_correct]) => ({ id, is_correct: is_correct as boolean }));
    if (scores.length > 0) {
      await fetch(`/api/admin/trivia/rounds/${roundId}/score`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ scores }),
      });
    }
    const res = await fetch(`/api/admin/trivia/rounds/${roundId}`);
    if (res.ok) {
      const d = await res.json() as { correctCount: number; responses: OpenResponse[] };
      setOpenResponses(d.responses ?? []);
      setTriviaCorrect(d.correctCount ?? 0);
      const refreshed: Record<string, boolean | null> = {};
      for (const r of d.responses ?? []) refreshed[r.id] = r.is_correct;
      setLocalScores(refreshed);
    }
    setScoringLoading(false);
    setScoringSaved(true);
    setTimeout(() => setScoringSaved(false), 2500);
  }

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

  // Poll trivia results — uses triviaRound.id (set immediately on start) with
  // display?.trivia_round_id as fallback so polling works even before Realtime fires.
  useEffect(() => {
    const roundId = triviaRound?.id ?? display?.trivia_round_id;
    if (!roundId) { setTriviaCount(0); setTriviaCorrect(0); return; }
    let cancelled = false;
    async function pollRound() {
      const [rRes, resRes] = await Promise.all([
        fetch(`/api/trivia/${roundId}`),
        fetch(`/api/trivia/${roundId}/results`),
      ]);
      if (cancelled) return;
      if (rRes.ok) {
        const round = await rRes.json() as TriviaRound;
        // Never let a stale poll response downgrade the status (e.g. active after we already
        // moved to revealing). Status only moves forward: active → revealing → closed.
        const ORDER: Record<string, number> = { active: 0, revealing: 1, closed: 2 };
        setTriviaRound(prev => {
          if (prev && (ORDER[round.status] ?? 0) < (ORDER[prev.status] ?? 0)) return prev;
          return round;
        });
      }
      if (resRes.ok) {
        const d = await resRes.json() as { total: number; correct: number };
        setTriviaCount(d.total);
        // For open_input, is_correct is set via admin scoring — don't let the public
        // results endpoint (which counts is_correct=true) reset what admin just saved.
        // The openResponses effect manages triviaCorrect for open_input independently.
        if (triviaRound?.type !== "open_input") setTriviaCorrect(d.correct);
      }
    }
    pollRound();
    const id = setInterval(pollRound, 4000);
    return () => { cancelled = true; clearInterval(id); };
  }, [triviaRound?.id, triviaRound?.type, display?.trivia_round_id]);

  async function startTriviaRound() {
    if (!event || !selectedQId || !hasPermission("trivia")) return;
    setTriviaLoading(true);
    setTriviaCount(0);
    setTriviaCorrect(0);
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
    if (!hasPermission("trivia")) return;
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
    if (!hasPermission("trivia")) return;
    const roundId = display?.trivia_round_id ?? triviaRound?.id;
    if (!roundId || !event) return;
    setTriviaLoading(true);
    // Clear optimistically so the poll effect doesn't race and restore the old closed round
    setTriviaRound(null);
    setTriviaCount(0);
    setTriviaCorrect(0);
    setOpenResponses([]);
    setLocalScores({});
    setOpenKeywords(null);
    setDisplay(prev => prev ? { ...prev, trivia_round_id: null } : prev);
    await fetch(`/api/admin/trivia/rounds/${roundId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action: "dismiss" }),
    });
    const { data } = await supabase.from("display_state").select("*").eq("event_id", event.id).maybeSingle();
    if (data) setDisplay(data as DisplayState);
    loadUsedQIds(event.id);
    setTriviaLoading(false);
  }

  async function finalizeTrivia() {
    if (!hasPermission("trivia")) return;
    const roundId = display?.trivia_round_id ?? triviaRound?.id;
    if (!roundId || !event) return;
    setTriviaLoading(true);
    // Clear optimistically so the poll effect doesn't race and restore the old closed round
    setTriviaRound(null);
    setTriviaCount(0);
    setTriviaCorrect(0);
    setOpenResponses([]);
    setLocalScores({});
    setOpenKeywords(null);
    setDisplay(prev => prev ? { ...prev, trivia_round_id: null } : prev);
    await fetch(`/api/admin/trivia/rounds/${roundId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action: "finalize", event_id: event.id }),
    });
    const { data } = await supabase.from("display_state").select("*").eq("event_id", event.id).maybeSingle();
    if (data) setDisplay(data as DisplayState);
    loadUsedQIds(event.id);
    setTriviaLoading(false);
  }

  // All display_state writes go through the server API so team members with only
  // a control-link token (no Supabase session) can write past RLS.
  async function upsertDisplay(patch: Partial<DisplayState>) {
    if (!event || !display) return;
    setSaving(true);
    setSaveError(false);
    const updated = { ...display, ...patch };
    const payload = {
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
    };
    const tokenParam = controlToken ? `?t=${encodeURIComponent(controlToken)}` : "";
    let res = await fetch(`/api/live/${slug}/display${tokenParam}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    // Retry once on transient failure
    if (!res.ok) {
      await new Promise(r => setTimeout(r, 800));
      res = await fetch(`/api/live/${slug}/display${tokenParam}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
    }
    if (res.ok) {
      const json = await res.json() as { display: DisplayState };
      setDisplay(json.display);
    } else {
      setSaveError(true);
      setTimeout(() => setSaveError(false), 3000);
    }
    setSaving(false);
  }

  async function initDisplay() {
    if (!event || !hasPermission("scenes")) return;
    setSaving(true);
    const tokenParam = controlToken ? `?t=${encodeURIComponent(controlToken)}` : "";
    const res = await fetch(`/api/live/${slug}/display${tokenParam}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        event_id: event.id, scene: "branding", song_id: null,
        verse_index: 0, custom_text: null, theme: "dark", show_qr: false,
        featured_feedback: null, featured_feedback_author: null,
      }),
    });
    if (res.ok) {
      const json = await res.json() as { display: DisplayState };
      setDisplay(json.display);
    }
    setSaving(false);
  }

  async function setScene(scene: SceneKey) {
    if (!hasPermission("scenes")) return;
    await upsertDisplay({ scene, verse_index: 0 });
  }

  async function setSong(songId: string, sessionSongId: string) {
    if (!hasPermission("music")) return;
    if (display?.session_song_id === sessionSongId) {
      await upsertDisplay({ song_id: null, session_song_id: null, verse_index: 0 });
    } else {
      await upsertDisplay({ song_id: songId, session_song_id: sessionSongId, verse_index: 0, scene: "lyrics" });
    }
  }

  async function setTextItem(sessionSongId: string, text: string) {
    if (!hasPermission("music")) return;
    if (display?.session_song_id === sessionSongId) {
      await upsertDisplay({ session_song_id: null, custom_text: null });
    } else {
      await upsertDisplay({ session_song_id: sessionSongId, song_id: null, custom_text: text, scene: "custom", verse_index: 0 });
    }
  }

  async function nextVerse() {
    if (!hasPermission("music")) return;
    const verses = getLyricsVerses(activeSong?.lyrics ?? null);
    await upsertDisplay({ verse_index: Math.min((display?.verse_index ?? 0) + 1, verses.length - 1) });
  }

  async function prevVerse() {
    if (!hasPermission("music")) return;
    await upsertDisplay({ verse_index: Math.max((display?.verse_index ?? 0) - 1, 0) });
  }

  async function pushCustom() {
    if (!hasPermission("music")) return;
    await upsertDisplay({ custom_text: customText, scene: "custom" });
  }

  async function panic() {
    if (!hasPermission("scenes")) return;
    await upsertDisplay({ scene: "branding", featured_feedback: null });
  }

  async function setTheme(theme: string) {
    if (!hasPermission("scenes")) return;
    await upsertDisplay({ theme });
  }

  async function toggleQr() {
    if (!hasPermission("scenes")) return;
    await upsertDisplay({ show_qr: !display?.show_qr });
  }

  async function projectFeedback(message: string, authorName: string | null) {
    if (!hasPermission("feedback")) return;
    setProjecting(message);
    await upsertDisplay({ featured_feedback: message, featured_feedback_author: authorName });
    setProjecting(null);
  }

  async function dismissFeedback() {
    if (!hasPermission("feedback")) return;
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
        <div className="text-center max-w-xs">
          <div className="w-14 h-14 rounded-2xl bg-forest/8 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-forest/40">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h2 className="font-display text-lg font-semibold text-charcoal mb-1">Access required</h2>
          <p className="text-sm text-charcoal/50 mb-5 leading-relaxed">
            {controlToken
              ? "This control link has expired or is invalid. Ask the event admin for an updated link."
              : "Use the link shared by the event admin, or sign in with your admin account."}
          </p>
          {!controlToken && (
            <Link
              href={`/admin/login?redirect=/live/${slug}/control`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-cream text-sm font-medium hover:bg-moss transition-colors"
            >
              Sign in as admin
            </Link>
          )}
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

  // Trivia question picker — planned questions (from sessions) first, then rest of library
  const triviaPlanned = event.event_sessions
    .filter(s => s.trivia_question_id && s.trivia_questions)
    .map(s => ({
      id:           s.trivia_question_id!,
      question:     s.trivia_questions!.question,
      category:     s.trivia_questions!.category,
      sessionLabel: s.title,
    }));
  const triviaPlannedIds = new Set(triviaPlanned.map(p => p.id));
  const triviaLibrary = triviaQuestions
    .filter(q => !triviaPlannedIds.has(q.id))
    .map(q => ({ id: q.id, question: q.question, category: q.category, sessionLabel: null as string | null }));

  return (
    <div className="min-h-screen bg-forest text-cream max-w-md mx-auto px-4 py-5 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-cream/40 text-xs uppercase tracking-wider">Control Panel</p>
          <h1 className="font-display text-xl font-semibold text-cream">{event.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {saveError && (
            <span className="text-[10px] text-red-400 font-medium">Save failed</span>
          )}
          {saving && !saveError && <Loader2 size={14} className="animate-spin text-cream/40" />}
          {/* Realtime connection indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-cream/10">
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              realtimeStatus === "connected"    && "bg-green-400 animate-pulse",
              realtimeStatus === "connecting"   && "bg-amber-400 animate-pulse",
              realtimeStatus === "disconnected" && "bg-red-400",
            )} />
            <span className="text-[10px] text-cream/40">
              {realtimeStatus === "connected"    ? "Live" :
               realtimeStatus === "connecting"   ? "Sync..." :
               "Offline"}
            </span>
          </div>
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

      {/* Focus tabs — filtered by permissions */}
      {(() => {
        const hasFullAccess = permissions.includes("full");
        const visibleTabs = ([
          { key: "all",      label: "General",  badge: false },
          { key: "music",    label: "Music",    badge: false },
          { key: "scenes",   label: "Scenes",   badge: false },
          { key: "trivia",   label: "Trivia",   badge: triviaRound?.status === "active" },
          { key: "feedback", label: "Feedback", badge: feedback.length > 0 },
        ] as const).filter(t => hasFullAccess || permissions.includes(t.key));
        if (visibleTabs.length <= 1) return null; // single-tab: no tab bar needed
        return (
      <div className="flex items-center gap-1 mb-5 bg-cream/8 rounded-2xl p-1">
        {visibleTabs.map(({ key, label, badge }) => (
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
        );
      })()}

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
          <section className="mb-3">
            <button
              onClick={() => setOpenSection(s => s === "scenes" ? "" : "scenes")}
              className="w-full flex items-center justify-between mb-3 group"
            >
              <h2 className="text-xs text-cream/40 uppercase tracking-wider">Scenes</h2>
              <ChevronDown size={13} className={`text-cream/30 transition-transform duration-200 ${openSection === "scenes" ? "rotate-180" : ""}`} />
            </button>
            {openSection === "scenes" && (
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
            )}
          </section>
          )}

          {/* Program — session + song navigation */}
          {(focusTab === "all" || focusTab === "music") && (
          <section className="mb-3">
            <button
              onClick={() => setOpenSection(s => s === "music" ? "" : "music")}
              className="w-full flex items-center justify-between mb-3 group"
            >
              <h2 className="text-xs text-cream/40 uppercase tracking-wider">Program</h2>
              <ChevronDown size={13} className={`text-cream/30 transition-transform duration-200 ${openSection === "music" ? "rotate-180" : ""}`} />
            </button>
            {openSection === "music" && <>
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
                        {/* Session header — accordion toggle */}
                        <button
                          onClick={() => setOpenSessionId(id => id === sess.id ? null : sess.id)}
                          className={`w-full px-3 py-2.5 flex items-center gap-2 text-xs font-semibold transition-colors ${
                            sessIsActive ? "bg-gold/15 text-gold" : "bg-cream/8 text-cream/50 hover:bg-cream/12"
                          }`}
                        >
                          <Music size={10} className="flex-shrink-0" />
                          <span className="flex-1 text-left">{sess.title}</span>
                          {sessIsActive && <span className="text-[9px] uppercase tracking-wider text-gold/70">active</span>}
                          <ChevronDown size={12} className={`flex-shrink-0 transition-transform duration-200 ${openSessionId === sess.id ? "rotate-180" : ""} ${sessIsActive ? "text-gold/50" : "text-cream/25"}`} />
                        </button>
                        {/* Program items — only shown when session is open */}
                        {openSessionId === sess.id && (sess.session_songs.length === 0 ? (
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
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-medium truncate">{song.title}</p>
                                    {song.key && (
                                      <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gold/20 text-gold border border-gold/30">
                                        {song.key}
                                      </span>
                                    )}
                                  </div>
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
                        ))}
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Verse navigation — shown when a song is active */}
            {activeSong && verses.length > 0 && (
              <div className="mt-3 bg-cream/8 rounded-2xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-xs text-gold/70 font-semibold truncate">{activeSong.title}</p>
                    {activeSong.key && (
                      <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gold/25 text-gold border border-gold/40">
                        {activeSong.key}
                      </span>
                    )}
                  </div>
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
            </>}
          </section>
          )}

          {/* Custom text + Display theme (under Scenes) */}
          {(focusTab === "all" || focusTab === "scenes") && openSection === "scenes" && (
          <section className="mb-3 space-y-3">
            <textarea value={customText} onChange={e => setCustomText(e.target.value)} rows={3}
              placeholder="Push custom text to display…"
              className="w-full bg-cream/10 border border-cream/10 rounded-xl px-3 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold resize-none" />
            <button onClick={pushCustom} disabled={!customText.trim() || saving}
              className="w-full py-2.5 rounded-xl bg-cream/15 hover:bg-cream/25 text-cream text-sm font-medium disabled:opacity-40 transition-colors">
              Push to display
            </button>
          </section>
          )}

          {/* Attendee feedback */}
          {(focusTab === "all" || focusTab === "feedback") && (
          <section className="mb-3">
            <button
              onClick={() => setOpenSection(s => s === "feedback" ? "" : "feedback")}
              className="w-full flex items-center justify-between mb-3 group"
            >
              <h2 className="text-xs text-cream/40 uppercase tracking-wider">Attendee feedback</h2>
              <div className="flex items-center gap-2">
                {loadingFeedback && <Loader2 size={12} className="animate-spin text-cream/30" />}
                {!loadingFeedback && feedback.length > 0 && (
                  <span className="text-[10px] text-gold/70 bg-gold/15 px-2 py-0.5 rounded-full">{feedback.length}</span>
                )}
                <ChevronDown size={13} className={`text-cream/30 transition-transform duration-200 ${openSection === "feedback" ? "rotate-180" : ""}`} />
              </div>
            </button>

            {openSection === "feedback" && (
              feedback.length === 0 ? (
                <p className="text-cream/25 text-xs text-center py-4">No feedback yet</p>
              ) : (
                <div className="space-y-2 overflow-y-auto max-h-72">
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
          <section className="mb-3">
            <button
              onClick={() => setOpenSection(s => s === "trivia" ? "" : "trivia")}
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
                  <span className="text-[10px] text-gold font-bold bg-gold/20 px-2 py-0.5 rounded-full">Scores up</span>
                )}
                <ChevronDown size={13} className={`text-cream/30 transition-transform duration-200 ${openSection === "trivia" ? "rotate-180" : ""}`} />
              </div>
            </button>

            {openSection === "trivia" && (
              <div className="space-y-3">
                {/* Scores on display — next question or end trivia */}
                {triviaRound && triviaRound.status === "closed" ? (
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
                        End trivia
                      </button>
                    </div>
                  </div>
                ) : triviaRound && ["active", "revealing"].includes(triviaRound.status) ? (
                  /* Active round controls */
                  <div className="bg-cream/8 rounded-2xl p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gold">Round in progress</p>
                        <p className="text-[10px] text-cream/40 mt-0.5">
                          {triviaCount} answered
                          {triviaRound.type !== "open_input" && ` · ${triviaCorrect} correct`}
                          {triviaRound.type === "open_input" && triviaCorrect > 0 && ` · ${triviaCorrect} scored`}
                        </p>
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                        triviaRound.status === "active" ? "bg-green-500/20 text-green-300" : "bg-gold/20 text-gold"
                      }`}>
                        {triviaRound.status === "active" ? "Live" : "Revealing"}
                      </span>
                    </div>
                    {/* Action buttons — MC gets 2 buttons (reveal + end), open_input gets 1 */}
                    <div className={cn("grid gap-2", triviaRound.status === "active" && triviaRound.type === "multiple_choice" ? "grid-cols-2" : "grid-cols-1")}>
                      {triviaRound.status === "active" && triviaRound.type === "multiple_choice" && (
                        <button
                          onClick={() => patchTriviaRound("reveal")}
                          disabled={triviaLoading}
                          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gold/20 text-gold hover:bg-gold/30 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          <Eye size={12} /> Reveal answer
                        </button>
                      )}
                      <button
                        onClick={() => patchTriviaRound(
                          // open_input "End round": go to revealing so the response scorer appears
                          // MC "End round" or any "Show scores": go straight to closed
                          triviaRound.status === "active" && triviaRound.type === "open_input" ? "reveal" : "close"
                        )}
                        disabled={triviaLoading}
                        className={cn(
                          "flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50",
                          triviaRound.status === "active"
                            ? "bg-cream/15 text-cream/70 hover:bg-cream/25"
                            : "bg-gold text-forest hover:bg-gold-light"
                        )}
                      >
                        {triviaLoading ? <Loader2 size={12} className="animate-spin" /> : <Trophy size={12} />}
                        {triviaRound.status === "active" ? "End round" : "Show scores"}
                      </button>
                    </div>

                    {/* Open-input response reviewer — shown while revealing so admin can score before closing */}
                    {triviaRound.type === "open_input" && triviaRound.status === "revealing" && (
                      <div className="space-y-2 pt-1 border-t border-cream/10">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-cream/35 uppercase tracking-wider">Responses</p>
                          {openKeywords && openResponses.length > 0 && (
                            <button
                              onClick={applyKeywordDetection}
                              className="text-[9px] text-gold/55 hover:text-gold transition-colors"
                            >
                              Auto-detect
                            </button>
                          )}
                        </div>
                        {openResponses.length === 0 ? (
                          <p className="text-[11px] text-cream/25 text-center py-2">No responses yet</p>
                        ) : (
                          <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
                            {openResponses.map(r => {
                              const score = localScores[r.id] ?? null;
                              return (
                                <div key={r.id} className={cn(
                                  "flex items-center gap-2 px-2.5 py-2 rounded-xl border transition-all",
                                  score === true  ? "bg-green-500/12 border-green-500/20" :
                                  score === false ? "bg-red-500/10 border-red-500/15" :
                                                    "bg-cream/6 border-transparent"
                                )}>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] text-cream/85 leading-snug break-words">{r.answer_text}</p>
                                    <p className="text-[9px] text-cream/30 mt-0.5">{r.attendee_name ?? "Anonymous"}</p>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                      onClick={() => setLocalScores(prev => ({ ...prev, [r.id]: score === true ? null : true }))}
                                      className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                                        score === true ? "bg-green-500/40 text-green-300" : "bg-cream/10 text-cream/30 hover:bg-green-500/20 hover:text-green-400"
                                      )}
                                    >✓</button>
                                    <button
                                      onClick={() => setLocalScores(prev => ({ ...prev, [r.id]: score === false ? null : false }))}
                                      className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                                        score === false ? "bg-red-500/35 text-red-300" : "bg-cream/10 text-cream/30 hover:bg-red-500/20 hover:text-red-400"
                                      )}
                                    >✗</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <button
                          onClick={saveOpenScores}
                          disabled={scoringLoading}
                          className="w-full py-2 rounded-xl bg-gold/20 text-gold text-xs font-semibold hover:bg-gold/30 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
                        >
                          {scoringLoading
                            ? <Loader2 size={11} className="animate-spin" />
                            : scoringSaved ? <CheckCircle2 size={11} /> : null
                          }
                          {scoringSaved ? "Scores saved" : "Save scores"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Launch controls */
                  <div className="space-y-3">
                    {/* Final leaderboard is on display — close it before starting anything new */}
                    {display?.scene === "trivia" && display?.custom_text === "__final_leaderboard__" && (
                      <div className="bg-gold/10 border border-gold/25 rounded-2xl p-3 space-y-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🏆</span>
                          <div>
                            <p className="text-xs font-semibold text-gold">Final leaderboard on display</p>
                            <p className="text-[10px] text-cream/35 mt-0.5">Close when you&apos;re ready to move on</p>
                          </div>
                        </div>
                        <button
                          onClick={() => upsertDisplay({ scene: "branding", custom_text: null })}
                          disabled={saving}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gold text-forest text-xs font-semibold hover:bg-gold-light transition-colors disabled:opacity-50"
                        >
                          {saving ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                          Close trivia session
                        </button>
                      </div>
                    )}
                    {triviaQuestions.length === 0 ? (
                      <p className="text-[11px] text-cream/30 text-center py-3">
                        No trivia questions yet — add some in Library → Trivia
                      </p>
                    ) : (
                      <>
                        {/* Unified question picker: planned questions first, then rest of library */}
                        <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
                          {triviaPlanned.length > 0 && (
                            <p className="text-[9px] text-cream/30 uppercase tracking-wider px-0.5 pb-0.5">Planned</p>
                          )}
                          {triviaPlanned.map(entry => (
                            <button
                              key={entry.id}
                              onClick={() => setSelectedQId(entry.id)}
                              className={cn(
                                "w-full text-left px-3 py-2 rounded-xl border transition-all",
                                selectedQId === entry.id
                                  ? "bg-gold/15 border-gold/40"
                                  : "bg-cream/6 border-transparent text-cream/60 hover:bg-cream/12 hover:text-cream/80"
                              )}
                            >
                              <div className="flex items-start gap-2">
                                <div className={cn(
                                  "w-3 h-3 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all",
                                  selectedQId === entry.id ? "bg-gold border-gold" : "border-cream/25"
                                )} />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] leading-snug line-clamp-2 text-cream/80">{entry.question}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] text-gold/50 uppercase tracking-wide">{entry.category}</span>
                                    <span className="text-[9px] text-cream/30">· {entry.sessionLabel}</span>
                                    {usedQIds.has(entry.id) && (
                                      <span className="text-[9px] text-cream/25">· played</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}

                          {triviaLibrary.length > 0 && (
                            <p className={cn(
                              "text-[9px] text-cream/30 uppercase tracking-wider px-0.5 pb-0.5",
                              triviaPlanned.length > 0 && "pt-2"
                            )}>
                              {triviaPlanned.length > 0 ? "Library" : "Questions"}
                            </p>
                          )}
                          {triviaLibrary.map(entry => (
                            <button
                              key={entry.id}
                              onClick={() => setSelectedQId(entry.id)}
                              className={cn(
                                "w-full text-left px-3 py-2 rounded-xl border transition-all",
                                selectedQId === entry.id
                                  ? "bg-gold/15 border-gold/40"
                                  : "bg-cream/6 border-transparent text-cream/60 hover:bg-cream/12 hover:text-cream/80"
                              )}
                            >
                              <div className="flex items-start gap-2">
                                <div className={cn(
                                  "w-3 h-3 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all",
                                  selectedQId === entry.id ? "bg-gold border-gold" : "border-cream/25"
                                )} />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] leading-snug line-clamp-2 text-cream/80">{entry.question}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] text-gold/50 uppercase tracking-wide">{entry.category}</span>
                                    {usedQIds.has(entry.id) && (
                                      <span className="text-[9px] text-cream/25">· played</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>

                        {selectedQId && usedQIds.has(selectedQId) && (
                          <p className="text-[10px] text-gold/50">This question was already played this event.</p>
                        )}

                        {/* Timer + Launch */}
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
                          Switching to Trivia scene opens answering for attendees.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
          )}

          {/* Display theme — shown in scenes section */}
          {(focusTab === "all" || focusTab === "scenes") && openSection === "scenes" && (
          <section className="mb-3">
            <p className="text-[10px] font-semibold text-cream/30 uppercase tracking-wider mb-2">Display theme</p>
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
