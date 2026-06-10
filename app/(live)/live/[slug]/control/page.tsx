/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  Tv2, Music, ChevronLeft, ChevronRight, ChevronDown, Clock, Users,
  BookOpen, Heart, Zap, AlignLeft, MessageSquare, Loader2,
  ExternalLink, QrCode, Sun, Moon, Leaf, Images,
  CheckCircle2, X,
} from "lucide-react";
import Link from "next/link";

type DisplayState = {
  id:                       string;
  event_id:                 string;
  scene:                    string;
  song_id:                  string | null;
  verse_index:              number;
  custom_text:              string | null;
  theme:                    string;
  show_qr:                  boolean;
  featured_feedback:        string | null;
  featured_feedback_author: string | null;
};

type Song = { id: string; title: string; artist: string | null; lyrics: string | null };

type EventData = {
  id:          string;
  title:       string;
  event_date:  string;
  slug:        string;
  event_sessions: Array<{
    id: string;
    title: string;
    sort_order: number;
    session_songs: Array<{ vocalist: string | null; songs: Song | null }>;
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
  const [activeSong, setActiveSong] = useState<Song | null>(null);

  // Feedback state
  const [feedback,         setFeedback]        = useState<Feedback[]>([]);
  const [loadingFeedback,  setLoadingFeedback] = useState(false);
  const [projecting,       setProjecting]      = useState<string | null>(null);
  const [feedbackOpen,     setFeedbackOpen]    = useState(true);

  // Auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setAuthed(!!user));
  }, []);

  // Load event data once authed
  useEffect(() => {
    if (authed !== true) return;
    supabase
      .from("events")
      .select("id, title, event_date, slug, event_sessions(id, title, sort_order, session_songs(vocalist, songs(id, title, artist, lyrics)))")
      .eq("slug", slug)
      .single()
      .then(({ data }) => {
        if (!data) return;
        const ev = data as unknown as EventData;
        setEvent(ev);
        return supabase.from("display_state").select("*").eq("event_id", ev.id).maybeSingle();
      })
      .then(res => {
        if (res?.data) setDisplay(res.data as DisplayState);
      });
  }, [slug, authed]);

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

  async function upsertDisplay(patch: Partial<DisplayState>) {
    if (!event || !display) return;
    setSaving(true);
    const updated = { ...display, ...patch };
    const { data } = await supabase.from("display_state").upsert({
      id:                       display.id,
      event_id:                 event.id,
      scene:                    updated.scene,
      song_id:                  updated.song_id,
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
  async function setSong(songId: string)      { await upsertDisplay({ song_id: songId, verse_index: 0, scene: "lyrics" }); }
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
    <div className="min-h-screen bg-forest text-cream max-w-md mx-auto px-4 py-5 pb-16">
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
      <div className="bg-cream/10 rounded-2xl px-4 py-3 mb-5 flex items-center justify-between">
        <span className="text-xs text-cream/50">Current scene</span>
        <span className="text-sm font-semibold text-gold uppercase tracking-wider">{display?.scene ?? "—"}</span>
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

          {/* Program — session + song navigation */}
          <section className="mb-5">
            <h2 className="text-xs text-cream/40 uppercase tracking-wider mb-3">Program</h2>
            {event.event_sessions.length === 0 ? (
              <p className="text-cream/30 text-xs text-center py-4">No program built yet</p>
            ) : (
              <div className="space-y-2">
                {[...event.event_sessions]
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map(sess => {
                    const sessIsActive = sess.session_songs.some(ss => ss.songs?.id === display.song_id);
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
                        {/* Songs in session */}
                        {sess.session_songs.length === 0 ? (
                          <div className="px-3 py-2 text-[10px] text-cream/20">No songs</div>
                        ) : (
                          sess.session_songs.map((ss) => {
                            const song = ss.songs;
                            if (!song) return null;
                            const isActive = song.id === display.song_id;
                            return (
                              <button
                                key={song.id}
                                onClick={() => setSong(song.id)}
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

          {/* Custom text */}
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

          {/* Attendee feedback — collapsible */}
          <section className="mb-5">
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
                <ChevronDown
                  size={13}
                  className={`text-cream/30 transition-transform duration-200 ${feedbackOpen ? "rotate-180" : ""}`}
                />
              </div>
            </button>

            {feedbackOpen && (
              feedback.length === 0 ? (
                <p className="text-cream/25 text-xs text-center py-4">No feedback yet</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {feedback.map((fb) => (
                    <div key={fb.id}
                      className="bg-cream/8 rounded-xl p-3 flex items-start gap-2.5">
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

          {/* Display theme */}
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

          {/* QR code toggle */}
          <section className="mb-6">
            <h2 className="text-xs text-cream/40 uppercase tracking-wider mb-3">QR Code</h2>
            <button onClick={toggleQr} disabled={saving}
              className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all border ${
                display.show_qr
                  ? "bg-gold/20 border-gold/40 text-gold"
                  : "bg-cream/10 border-cream/10 text-cream/60 hover:bg-cream/20"
              }`}>
              <QrCode size={15} />
              {display.show_qr ? "Hide QR code" : "Show QR code on display"}
            </button>
            <p className="text-[10px] text-cream/25 mt-1.5 text-center">Links to the live program page</p>
          </section>

          {/* Panic button */}
          <button onClick={panic} disabled={saving}
            className="w-full py-3.5 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50">
            ⚡ Back to branding
          </button>
        </>
      )}
    </div>
  );
}
