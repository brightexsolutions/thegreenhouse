/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  Tv2, Music, ChevronLeft, ChevronRight, Clock, Users,
  BookOpen, Heart, Zap, AlignLeft, MessageSquare, Loader2, ExternalLink
} from "lucide-react";
import Link from "next/link";

type DisplayState = {
  id:          string;
  event_id:    string;
  scene:       string;
  song_id:     string | null;
  verse_index: number;
  custom_text: string | null;
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
    session_songs: Array<{ songs: Song | null }>;
  }>;
};

function useSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const SCENES = [
  { key: "branding",    label: "Branding",   icon: Tv2 },
  { key: "countdown",   label: "Countdown",  icon: Clock },
  { key: "now_playing", label: "Now Playing",icon: Music },
  { key: "lyrics",      label: "Lyrics",     icon: AlignLeft },
  { key: "program",     label: "Program",    icon: BookOpen },
  { key: "theme",       label: "Theme",      icon: Zap },
  { key: "prayer",      label: "Prayer",     icon: Heart },
  { key: "community",   label: "Community",  icon: Users },
  { key: "custom",      label: "Custom",     icon: MessageSquare },
] as const;

type SceneKey = typeof SCENES[number]["key"];

function getLyricsVerses(lyrics: string | null) {
  if (!lyrics) return [];
  return lyrics.split(/\n{2,}/).map(v => v.trim()).filter(Boolean);
}

export default function ControlPage({ params }: { params: { slug: string } }) {
  const [authed, setAuthed]     = useState<boolean | null>(null);
  const [event, setEvent]       = useState<EventData | null>(null);
  const [display, setDisplay]   = useState<DisplayState | null>(null);
  const [saving, setSaving]     = useState(false);
  const [customText, setCustomText] = useState("");
  const [activeSong, setActiveSong] = useState<Song | null>(null);

  const slug = params.slug;

  const supabase = useSupabase();

  // Auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setAuthed(!!user));
  }, []);

  // Load event data
  useEffect(() => {
    if (authed !== true) return;
    supabase
      .from("events")
      .select("id, title, event_date, slug, event_sessions(id, title, sort_order, session_songs(songs(id, title, artist, lyrics)))")
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

  // Realtime subscribe to display state
  useEffect(() => {
    if (!event) return;
    const channel = supabase
      .channel(`control-${event.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "display_state", filter: `event_id=eq.${event.id}` },
        (payload) => setDisplay(payload.new as DisplayState)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [event?.id]);

  // Keep custom text in sync
  useEffect(() => {
    if (display?.custom_text) setCustomText(display.custom_text);
  }, [display?.scene]);

  // Keep active song in sync
  useEffect(() => {
    if (!display?.song_id || !event) { setActiveSong(null); return; }
    const allSongs: Song[] = [];
    for (const sess of event.event_sessions) {
      for (const ss of sess.session_songs) {
        if (ss.songs) allSongs.push(ss.songs);
      }
    }
    setActiveSong(allSongs.find(s => s.id === display.song_id) ?? null);
  }, [display?.song_id, event]);

  async function upsertDisplay(patch: Partial<DisplayState>) {
    if (!event || !display) return;
    setSaving(true);
    const updated = { ...display, ...patch };
    await supabase.from("display_state").upsert({
      id:          display.id,
      event_id:    event.id,
      scene:       updated.scene,
      song_id:     updated.song_id,
      verse_index: updated.verse_index,
      custom_text: updated.custom_text,
      updated_at:  new Date().toISOString(),
    }, { onConflict: "event_id" });
    setDisplay(updated);
    setSaving(false);
  }

  async function initDisplay() {
    if (!event) return;
    setSaving(true);
    const { data } = await supabase
      .from("display_state")
      .upsert({ event_id: event.id, scene: "branding", song_id: null, verse_index: 0, custom_text: null, updated_at: new Date().toISOString() }, { onConflict: "event_id" })
      .select("*")
      .single();
    if (data) setDisplay(data as DisplayState);
    setSaving(false);
  }

  async function setScene(scene: SceneKey) {
    await upsertDisplay({ scene, verse_index: 0 });
  }

  async function setSong(songId: string) {
    await upsertDisplay({ song_id: songId, verse_index: 0, scene: "lyrics" });
  }

  async function nextVerse() {
    const verses = getLyricsVerses(activeSong?.lyrics ?? null);
    const next = Math.min((display?.verse_index ?? 0) + 1, verses.length - 1);
    await upsertDisplay({ verse_index: next });
  }

  async function prevVerse() {
    const prev = Math.max((display?.verse_index ?? 0) - 1, 0);
    await upsertDisplay({ verse_index: prev });
  }

  async function pushCustom() {
    await upsertDisplay({ custom_text: customText, scene: "custom" });
  }

  async function panic() {
    await upsertDisplay({ scene: "branding" });
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
      if (ss.songs && !allSongs.find(s => s.id === ss.songs!.id)) {
        allSongs.push(ss.songs);
      }
    }
  }

  const verses = getLyricsVerses(activeSong?.lyrics ?? null);

  return (
    <div className="min-h-screen bg-forest text-cream max-w-md mx-auto px-4 py-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-cream/40 text-xs uppercase tracking-wider">Control Panel</p>
          <h1 className="font-display text-xl font-semibold text-cream">{event.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {saving && <Loader2 size={14} className="animate-spin text-cream/40" />}
          <a
            href={`/live/${event.slug}/display`}
            target="_blank"
            rel="noopener"
            className="p-2 rounded-xl bg-cream/10 hover:bg-cream/20 transition-colors"
          >
            <ExternalLink size={14} className="text-cream/60" />
          </a>
        </div>
      </div>

      {/* Current scene chip */}
      <div className="bg-cream/10 rounded-2xl px-4 py-3 mb-5 flex items-center justify-between">
        <span className="text-xs text-cream/50">Current scene</span>
        <span className="text-sm font-semibold text-gold uppercase tracking-wider">
          {display?.scene ?? "—"}
        </span>
      </div>

      {/* Init display state if not set */}
      {!display && (
        <button
          onClick={initDisplay}
          disabled={saving}
          className="w-full py-3 rounded-2xl bg-gold text-forest font-semibold text-sm mb-4 disabled:opacity-50"
        >
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
                <button
                  key={key}
                  onClick={() => setScene(key)}
                  disabled={saving}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl text-xs font-medium transition-all ${
                    display.scene === key
                      ? "bg-gold text-forest"
                      : "bg-cream/10 text-cream/60 hover:bg-cream/20"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Lyrics control */}
          <section className="mb-5">
            <h2 className="text-xs text-cream/40 uppercase tracking-wider mb-3">Lyrics</h2>

            {/* Song selector */}
            {allSongs.length > 0 ? (
              <div className="mb-3">
                <select
                  value={display.song_id ?? ""}
                  onChange={e => e.target.value && setSong(e.target.value)}
                  className="w-full bg-cream/10 border border-cream/10 rounded-xl px-3 py-2.5 text-sm text-cream focus:outline-none focus:border-gold"
                >
                  <option value="">Select a song…</option>
                  {allSongs.map(s => (
                    <option key={s.id} value={s.id}>{s.title}{s.artist ? ` — ${s.artist}` : ""}</option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-cream/30 text-xs mb-3">No songs in program yet</p>
            )}

            {/* Verse navigation */}
            {activeSong && verses.length > 0 && (
              <>
                <div className="bg-cream/5 rounded-xl p-3 mb-3 text-xs text-cream/50 min-h-[60px] whitespace-pre-line leading-relaxed">
                  {verses[display.verse_index] ?? "—"}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevVerse}
                    disabled={saving || display.verse_index === 0}
                    className="flex-1 py-3 rounded-xl bg-cream/10 hover:bg-cream/20 disabled:opacity-30 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <span className="text-cream/30 text-xs tabular-nums w-12 text-center">
                    {display.verse_index + 1}/{verses.length}
                  </span>
                  <button
                    onClick={nextVerse}
                    disabled={saving || display.verse_index >= verses.length - 1}
                    className="flex-1 py-3 rounded-xl bg-cream/10 hover:bg-cream/20 disabled:opacity-30 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </>
            )}
          </section>

          {/* Custom text / prayer push */}
          <section className="mb-6">
            <h2 className="text-xs text-cream/40 uppercase tracking-wider mb-3">Custom text</h2>
            <textarea
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              rows={3}
              placeholder="Type any text to push to the display…"
              className="w-full bg-cream/10 border border-cream/10 rounded-xl px-3 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold resize-none"
            />
            <button
              onClick={pushCustom}
              disabled={!customText.trim() || saving}
              className="w-full mt-2 py-3 rounded-xl bg-cream/15 hover:bg-cream/25 text-cream text-sm font-medium disabled:opacity-40 transition-colors"
            >
              Push to display
            </button>
          </section>

          {/* Panic / branding */}
          <button
            onClick={panic}
            disabled={saving}
            className="w-full py-3.5 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50"
          >
            ⚡ Back to branding
          </button>
        </>
      )}
    </div>
  );
}
