/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Maximize2 } from "lucide-react";

type DisplayState = {
  scene:       string;
  song_id:     string | null;
  verse_index: number;
  custom_text: string | null;
  updated_at:  string;
};

type Song = {
  id: string;
  title: string;
  artist: string | null;
  lyrics: string | null;
};

type Session = {
  id: string;
  title: string;
  type: string;
  sort_order: number;
  session_songs: Array<{ songs: Song | null }>;
};

type EventData = {
  id: string;
  title: string;
  subtitle: string | null;
  event_date: string;
  event_time: string;
  theme_title: string | null;
  theme_scripture: string | null;
  theme_description: string | null;
  venue_name: string | null;
  event_sessions: Session[];
};

function useSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function getLinesFromLyrics(lyrics: string | null) {
  if (!lyrics) return [];
  return lyrics.split(/\n{2,}/).map(v => v.trim()).filter(Boolean);
}

export default function DisplayPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug]           = useState<string | null>(null);
  const [event, setEvent]         = useState<EventData | null>(null);
  const [display, setDisplay]     = useState<DisplayState | null>(null);
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resolve params
  useEffect(() => {
    params.then(p => setSlug(p.slug));
  }, [params]);

  const supabase = useSupabase();

  // Load event + initial display state
  useEffect(() => {
    if (!slug) return;
    async function load() {
      const { data: ev } = await supabase
        .from("events")
        .select("id, title, subtitle, event_date, event_time, theme_title, theme_scripture, theme_description, venue_name, event_sessions(id, title, type, sort_order, session_songs(songs(id, title, artist, lyrics)))")
        .eq("slug", slug!)
        .single();
      if (!ev) return;
      setEvent(ev as unknown as EventData);

      const { data: ds } = await supabase
        .from("display_state")
        .select("*")
        .eq("event_id", (ev as { id: string }).id)
        .maybeSingle();
      if (ds) setDisplay(ds as DisplayState);
    }
    load();
  }, [slug]);

  // Update active song when display state changes
  useEffect(() => {
    if (!display?.song_id || !event) { setActiveSong(null); return; }
    const allSongs: Song[] = [];
    for (const sess of event.event_sessions) {
      for (const ss of sess.session_songs) {
        if (ss.songs) allSongs.push(ss.songs);
      }
    }
    const found = allSongs.find(s => s.id === display.song_id) ?? null;
    setActiveSong(found);
  }, [display?.song_id, event]);

  // Subscribe to Realtime display_state changes
  useEffect(() => {
    if (!event) return;
    const channel = supabase
      .channel(`display-${event.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "display_state", filter: `event_id=eq.${event.id}` },
        (payload) => setDisplay(payload.new as DisplayState)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [event?.id]);

  // Auto fullscreen
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof document === "undefined") return;
    const enterFs = () => {
      el.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    };
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    setTimeout(enterFs, 800);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Hide cursor after 3s
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;
    const show = () => { el.style.cursor = "default"; clearTimeout(timer); timer = setTimeout(() => { el.style.cursor = "none"; }, 3000); };
    el.addEventListener("mousemove", show);
    timer = setTimeout(() => { el.style.cursor = "none"; }, 3000);
    return () => { el.removeEventListener("mousemove", show); clearTimeout(timer); };
  }, []);

  if (!event || !display) {
    return (
      <div className="fixed inset-0 bg-[#0d1a12] flex items-center justify-center">
        <p className="text-cream/30 text-sm font-display">Loading…</p>
      </div>
    );
  }

  const scene = display.scene;
  const verses = getLinesFromLyrics(activeSong?.lyrics ?? null);
  const currentVerse = verses[display.verse_index] ?? "";

  const formattedDate = new Date(event.event_date).toLocaleDateString("en-KE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-[#0d1a12] flex items-center justify-center overflow-hidden"
      style={{ fontFamily: "var(--font-cormorant), serif" }}
    >
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(201,162,74,0.06),transparent)] pointer-events-none" />

      {/* Scene content */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-12 md:p-20">
        {scene === "branding" && (
          <div className="text-center">
            <div className="text-cream/20 text-xs uppercase tracking-[0.4em] mb-8">The Green House</div>
            <h1 className="font-display text-6xl md:text-8xl font-semibold text-cream leading-tight">
              {event.title}
            </h1>
            <p className="text-cream/40 mt-6 text-xl md:text-2xl">{formattedDate}</p>
            {event.venue_name && <p className="text-cream/25 mt-2 text-base md:text-lg">{event.venue_name}</p>}
            {event.subtitle && <p className="text-gold/60 mt-8 text-base md:text-lg italic">{event.subtitle}</p>}
          </div>
        )}

        {scene === "countdown" && (
          <CountdownScene eventDate={event.event_date} eventTime={event.event_time} />
        )}

        {scene === "now_playing" && activeSong && (
          <div className="text-center">
            <p className="text-gold/50 text-sm uppercase tracking-[0.3em] mb-8">Now Playing</p>
            <h1 className="font-display text-6xl md:text-8xl font-semibold text-cream">{activeSong.title}</h1>
            {activeSong.artist && (
              <p className="text-cream/40 mt-6 text-2xl md:text-3xl">{activeSong.artist}</p>
            )}
          </div>
        )}

        {scene === "lyrics" && (
          <div className="text-center max-w-4xl">
            {activeSong && (
              <p className="text-gold/30 text-xs uppercase tracking-[0.3em] mb-10">{activeSong.title}</p>
            )}
            <div className="font-display text-4xl md:text-6xl lg:text-7xl font-medium text-cream leading-snug whitespace-pre-line">
              {currentVerse || <span className="text-cream/20 italic text-3xl">No verse loaded</span>}
            </div>
            {verses.length > 0 && (
              <div className="flex justify-center gap-1.5 mt-12">
                {verses.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === display.verse_index ? "bg-gold" : "bg-cream/15"}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {scene === "program" && (
          <div className="w-full max-w-2xl">
            <p className="text-gold/40 text-xs uppercase tracking-[0.3em] mb-8 text-center">Order of Service</p>
            <div className="space-y-4">
              {[...event.event_sessions]
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((sess, i) => (
                  <div
                    key={sess.id}
                    className="flex items-center gap-6 px-6 py-4 rounded-2xl border border-cream/5"
                  >
                    <span className="text-gold/40 font-display text-3xl font-semibold w-8 text-right">{i + 1}</span>
                    <span className="text-cream text-2xl md:text-3xl font-display font-medium">{sess.title}</span>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {scene === "theme" && (
          <div className="text-center max-w-3xl">
            <p className="text-gold/40 text-xs uppercase tracking-[0.3em] mb-10">Tonight&apos;s Theme</p>
            <h1 className="font-display text-7xl md:text-9xl font-bold text-cream mb-8">
              {event.theme_title ?? "—"}
            </h1>
            {event.theme_scripture && (
              <p className="text-gold text-xl md:text-2xl font-display italic">{event.theme_scripture}</p>
            )}
            {event.theme_description && (
              <p className="text-cream/40 mt-6 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
                {event.theme_description}
              </p>
            )}
          </div>
        )}

        {scene === "prayer" && (
          <div className="text-center max-w-3xl">
            <p className="text-gold/30 text-xs uppercase tracking-[0.3em] mb-12">Take a moment</p>
            <div className="font-display text-4xl md:text-6xl font-medium text-cream leading-snug whitespace-pre-line">
              {display.custom_text || "Close your eyes.\nBe still."}
            </div>
          </div>
        )}

        {scene === "community" && <CommunityScene eventId={event.id} supabase={supabase} />}

        {scene === "interlude" && (
          <div className="text-center">
            <div
              className="w-24 h-24 md:w-32 md:h-32 rounded-full border border-gold/20 flex items-center justify-center mx-auto mb-8"
              style={{ animation: "spin 20s linear infinite" }}
            >
              <div className="w-3 h-3 rounded-full bg-gold/40" />
            </div>
            <p className="font-display text-3xl text-cream/30 italic">The Green House</p>
          </div>
        )}

        {scene === "custom" && (
          <div className="text-center max-w-4xl">
            <div className="font-display text-4xl md:text-6xl lg:text-7xl font-medium text-cream leading-snug whitespace-pre-line">
              {display.custom_text || ""}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen button (shown when not fullscreen) */}
      {!isFullscreen && (
        <button
          onClick={() => containerRef.current?.requestFullscreen?.()}
          className="absolute top-4 right-4 p-2 rounded-xl bg-cream/10 hover:bg-cream/20 transition-colors"
        >
          <Maximize2 size={16} className="text-cream/50" />
        </button>
      )}

      {/* Scene indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-cream/15 text-xs uppercase tracking-widest">
        {scene}
      </div>
    </div>
  );
}

function CountdownScene({ eventDate, eventTime }: { eventDate: string; eventTime: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const target = new Date(`${eventDate}T${eventTime}`);
    function update() {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setRemaining("Starting now"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(h > 0
        ? `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
        : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [eventDate, eventTime]);

  return (
    <div className="text-center">
      <p className="text-gold/40 text-sm uppercase tracking-[0.3em] mb-8">Session begins in</p>
      <p className="font-display text-7xl md:text-9xl font-bold text-cream tabular-nums">{remaining}</p>
    </div>
  );
}

function CommunityScene({ eventId, supabase }: { eventId: string; supabase: ReturnType<typeof useSupabase> }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .is("deleted_at", null)
      .then(({ count: c }) => setCount(c));
  }, [eventId]);

  return (
    <div className="text-center">
      <p className="text-gold/40 text-xs uppercase tracking-[0.3em] mb-8">Tonight</p>
      {count !== null ? (
        <>
          <p className="font-display text-8xl md:text-[12rem] font-bold text-cream leading-none">{count}</p>
          <p className="text-cream/40 mt-6 text-xl md:text-2xl">people from across Nairobi</p>
        </>
      ) : (
        <p className="text-cream/20 font-display text-4xl">Loading…</p>
      )}
    </div>
  );
}
