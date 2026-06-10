/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Maximize2, Minimize2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { AnimatePresence, motion, type Variants } from "framer-motion";

type DisplayState = {
  scene:       string;
  song_id:     string | null;
  verse_index: number;
  custom_text: string | null;
  theme:       string;
  show_qr:     boolean;
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
  slug: string;
  event_sessions: Session[];
};

const THEMES = {
  dark: {
    bg:       "#0d1a12",
    surface:  "rgba(255,255,255,0.04)",
    text:     "#f7f2e8",
    sub:      "rgba(247,242,232,0.4)",
    gold:     "#c9a24a",
    goldSub:  "rgba(201,162,74,0.4)",
    glow:     "rgba(201,162,74,0.07)",
    border:   "rgba(247,242,232,0.08)",
    qrBg:     "#1b3a2a",
    qrFg:     "#f7f2e8",
    particle: "rgba(201,162,74,0.18)",
  },
  light: {
    bg:       "#f7f2e8",
    surface:  "rgba(27,58,42,0.04)",
    text:     "#1a1a18",
    sub:      "rgba(26,26,24,0.45)",
    gold:     "#1b3a2a",
    goldSub:  "rgba(27,58,42,0.35)",
    glow:     "rgba(27,58,42,0.03)",
    border:   "rgba(27,58,42,0.1)",
    qrBg:     "#1b3a2a",
    qrFg:     "#f7f2e8",
    particle: "rgba(27,58,42,0.07)",
  },
  forest: {
    bg:       "#1b3a2a",
    surface:  "rgba(247,242,232,0.06)",
    text:     "#f7f2e8",
    sub:      "rgba(247,242,232,0.5)",
    gold:     "#c9a24a",
    goldSub:  "rgba(201,162,74,0.5)",
    glow:     "rgba(201,162,74,0.10)",
    border:   "rgba(247,242,232,0.1)",
    qrBg:     "#0d1a12",
    qrFg:     "#f7f2e8",
    particle: "rgba(201,162,74,0.12)",
  },
} as const;
type ThemeKey = keyof typeof THEMES;

function getLinesFromLyrics(lyrics: string | null) {
  if (!lyrics) return [];
  return lyrics.split(/\n{2,}/).map(v => v.trim()).filter(Boolean);
}

const PARTICLE_DATA = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x:    5 + (i * 4.7) % 90,
  size: 2 + (i * 1.3) % 4,
  dur:  14 + (i * 2.1) % 16,
  del:  (i * 1.7) % 12,
  dx:   ((i % 2 === 0 ? 1 : -1) * (15 + (i * 3.7) % 40)),
}));

function Particles({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0)      translateX(0);   opacity: 0; }
          8%   { opacity: 1; }
          88%  { opacity: 0.6; }
          100% { transform: translateY(-105vh) translateX(var(--dx)); opacity: 0; }
        }
      `}</style>
      {PARTICLE_DATA.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left:       `${p.x}%`,
            bottom:     "-8px",
            width:      `${p.size}px`,
            height:     `${p.size}px`,
            background: color,
            animation:  `floatUp ${p.dur}s ${p.del}s infinite linear`,
            // @ts-expect-error custom css var
            "--dx":     `${p.dx}px`,
          }}
        />
      ))}
    </div>
  );
}

const sceneV: Variants = {
  initial: { opacity: 0, y: 20,  scale: 0.98 },
  animate: { opacity: 1, y: 0,   scale: 1,    transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:    { opacity: 0, y: -14, scale: 0.99,  transition: { duration: 0.28, ease: "easeIn" } },
};
const verseV: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0,  transition: { duration: 0.4, ease: "easeOut" } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.22 } },
};

export default function DisplayPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const supabaseRef = useRef(createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));
  const supabase = supabaseRef.current;

  const [event,        setEvent]       = useState<EventData | null>(null);
  const [display,      setDisplay]     = useState<DisplayState | null>(null);
  const [activeSong,   setActiveSong]  = useState<Song | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load event + initial display state
  useEffect(() => {
    async function load() {
      const { data: ev } = await supabase
        .from("events")
        .select("id, title, subtitle, event_date, event_time, theme_title, theme_scripture, theme_description, venue_name, slug, event_sessions(id, title, type, sort_order, session_songs(songs(id, title, artist, lyrics)))")
        .eq("slug", slug)
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

  // Realtime subscription — listens to any change on display_state
  useEffect(() => {
    if (!event) return;
    const channel = supabase
      .channel(`display-${event.id}`)
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

  // Polling fallback every 3s — ensures display stays in sync even if Realtime drops
  useEffect(() => {
    if (!event) return;
    const id = setInterval(async () => {
      const { data } = await supabase
        .from("display_state")
        .select("*")
        .eq("event_id", event.id)
        .maybeSingle();
      if (data) setDisplay(prev => {
        // Only update if something actually changed
        if (!prev || prev.updated_at !== (data as DisplayState).updated_at) return data as DisplayState;
        return prev;
      });
    }, 3000);
    return () => clearInterval(id);
  }, [event?.id]);

  // Sync active song
  useEffect(() => {
    if (!display?.song_id || !event) { setActiveSong(null); return; }
    const allSongs: Song[] = [];
    for (const sess of event.event_sessions) for (const ss of sess.session_songs) if (ss.songs) allSongs.push(ss.songs);
    setActiveSong(allSongs.find(s => s.id === display.song_id) ?? null);
  }, [display?.song_id, event]);

  // Fullscreen tracking
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Hide cursor after 3s idle
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let t: ReturnType<typeof setTimeout>;
    const show = () => { el.style.cursor = "default"; clearTimeout(t); t = setTimeout(() => { el.style.cursor = "none"; }, 3000); };
    el.addEventListener("mousemove", show);
    t = setTimeout(() => { el.style.cursor = "none"; }, 3000);
    return () => { el.removeEventListener("mousemove", show); clearTimeout(t); };
  }, []);

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await (containerRef.current ?? document.documentElement).requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch { /* not supported in this browser */ }
  }

  if (!event || !display) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#0d1a12" }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "rgba(201,162,74,0.2)", borderTopColor: "#c9a24a" }} />
      </div>
    );
  }

  const themeKey = ((display.theme ?? "dark") in THEMES ? display.theme : "dark") as ThemeKey;
  const t = THEMES[themeKey];
  const scene = display.scene;
  const verses = getLinesFromLyrics(activeSong?.lyrics ?? null);
  const currentVerse = verses[display.verse_index] ?? "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://greenhousews.co.ke";
  const registrationUrl = `${siteUrl}/events/${event.slug}`;
  const formattedDate = new Date(event.event_date).toLocaleDateString("en-KE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex items-center justify-center overflow-hidden select-none"
      style={{ background: t.bg, transition: "background 0.8s ease", fontFamily: "var(--font-cormorant), serif" }}
    >
      {/* Radial ambient glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 70% 55% at 50% 50%, ${t.glow}, transparent)` }} />

      {/* Floating particles */}
      <Particles color={t.particle} />

      {/* Scene content */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-12 md:p-20">
        <AnimatePresence mode="wait">
          <motion.div key={scene} variants={sceneV} initial="initial" animate="animate" exit="exit"
            className="w-full flex items-center justify-center">

            {scene === "branding" && (
              <div className="text-center flex flex-col items-center gap-0">
                {/* Brand */}
                <div className="text-[11px] uppercase tracking-[0.5em] mb-10" style={{ color: t.sub }}>The Green House</div>

                {/* Hero tagline */}
                <div className="font-display font-semibold leading-[1.1] mb-6" style={{ color: t.text, fontSize: "clamp(3rem,8vw,7rem)" }}>
                  Pause. Breathe.<br />Reflect. Worship.
                </div>

                {/* Session name */}
                <div className="text-lg md:text-2xl font-display font-medium mb-10" style={{ color: t.gold }}>
                  {event.title.replace("The Green House — ", "").replace("The Green House – ", "")}
                </div>

                {/* Meta info */}
                <div className="flex flex-col items-center gap-1.5">
                  <p className="text-sm md:text-base" style={{ color: t.sub }}>{formattedDate}</p>
                  {event.venue_name && <p className="text-sm" style={{ color: t.sub, opacity: 0.55 }}>{event.venue_name}</p>}
                  {event.subtitle && <p className="text-sm italic mt-1" style={{ color: t.sub, opacity: 0.5 }}>{event.subtitle}</p>}
                </div>
              </div>
            )}

            {scene === "countdown" && (
              <CountdownScene eventDate={event.event_date} eventTime={event.event_time} t={t} />
            )}

            {scene === "now_playing" && activeSong && (
              <div className="text-center">
                <p className="text-sm uppercase tracking-[0.3em] mb-8" style={{ color: t.goldSub }}>Now Playing</p>
                <h1 className="font-display text-6xl md:text-8xl font-semibold" style={{ color: t.text }}>{activeSong.title}</h1>
                {activeSong.artist && <p className="mt-6 text-2xl md:text-3xl" style={{ color: t.sub }}>{activeSong.artist}</p>}
              </div>
            )}

            {scene === "lyrics" && (
              <div className="text-center max-w-5xl w-full">
                {activeSong && (
                  <p className="text-[11px] uppercase tracking-[0.3em] mb-10" style={{ color: t.goldSub }}>{activeSong.title}</p>
                )}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`v-${display.verse_index}-${activeSong?.id}`}
                    variants={verseV} initial="initial" animate="animate" exit="exit"
                    className="font-display text-4xl md:text-6xl lg:text-7xl font-medium leading-snug whitespace-pre-line"
                    style={{ color: t.text }}
                  >
                    {currentVerse || <span style={{ color: t.sub, fontSize: "0.6em", fontStyle: "italic" }}>No verse loaded</span>}
                  </motion.div>
                </AnimatePresence>
                {verses.length > 1 && (
                  <div className="flex justify-center gap-2 mt-12">
                    {verses.map((_, i) => (
                      <div key={i} className="rounded-full transition-all duration-400"
                        style={{
                          width:      i === display.verse_index ? "24px" : "6px",
                          height:     "6px",
                          background: i === display.verse_index ? t.gold : t.border,
                        }} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {scene === "program" && (
              <div className="w-full max-w-2xl">
                <p className="text-[11px] uppercase tracking-[0.3em] mb-8 text-center" style={{ color: t.goldSub }}>Order of Service</p>
                <div className="space-y-3">
                  {[...event.event_sessions].sort((a, b) => a.sort_order - b.sort_order).map((sess, i) => (
                    <div key={sess.id} className="flex items-center gap-6 px-6 py-4 rounded-2xl"
                      style={{ border: `1px solid ${t.border}`, background: t.surface }}>
                      <span className="font-display text-3xl font-semibold w-8 text-right" style={{ color: t.goldSub }}>{i + 1}</span>
                      <span className="font-display text-2xl md:text-3xl font-medium" style={{ color: t.text }}>{sess.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {scene === "theme" && (
              <div className="text-center max-w-3xl">
                <p className="text-[11px] uppercase tracking-[0.3em] mb-10" style={{ color: t.goldSub }}>Tonight&apos;s Theme</p>
                <h1 className="font-display text-7xl md:text-9xl font-bold mb-8" style={{ color: t.text }}>{event.theme_title ?? "—"}</h1>
                {event.theme_scripture && <p className="text-xl md:text-2xl font-display italic" style={{ color: t.gold }}>{event.theme_scripture}</p>}
                {event.theme_description && (
                  <p className="mt-6 text-base md:text-lg max-w-xl mx-auto leading-relaxed" style={{ color: t.sub }}>{event.theme_description}</p>
                )}
              </div>
            )}

            {scene === "prayer" && (
              <div className="text-center max-w-3xl">
                <p className="text-[11px] uppercase tracking-[0.3em] mb-12" style={{ color: t.sub, opacity: 0.45 }}>Take a moment</p>
                <div className="font-display text-4xl md:text-6xl font-medium leading-snug whitespace-pre-line" style={{ color: t.text }}>
                  {display.custom_text || "Close your eyes.\nBe still."}
                </div>
              </div>
            )}

            {scene === "community" && <CommunityScene eventId={event.id} supabase={supabase} t={t} />}

            {scene === "interlude" && (
              <div className="text-center">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center mx-auto mb-8"
                  style={{ border: `1px solid ${t.border}`, animation: "spin 20s linear infinite" }}>
                  <div className="w-3 h-3 rounded-full" style={{ background: t.gold, opacity: 0.45 }} />
                </div>
                <p className="font-display text-3xl italic" style={{ color: t.sub }}>The Green House</p>
              </div>
            )}

            {scene === "custom" && (
              <div className="text-center max-w-4xl">
                <div className="font-display text-4xl md:text-6xl lg:text-7xl font-medium leading-snug whitespace-pre-line" style={{ color: t.text }}>
                  {display.custom_text || ""}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* QR code overlay */}
      <AnimatePresence>
        {display.show_qr && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 24 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.85, y: 24 }}
            transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
            className="absolute bottom-14 right-12 flex flex-col items-center gap-3 z-20 rounded-2xl p-5"
            style={{ background: t.qrBg, border: `1px solid ${t.border}` }}
          >
            <QRCodeSVG value={registrationUrl} size={160} bgColor={t.qrBg} fgColor={t.qrFg} level="M" />
            <p className="text-[10px] uppercase tracking-widest" style={{ color: t.qrFg, opacity: 0.45 }}>
              Scan to register
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen toggle (fades in on hover) */}
      <div className="absolute top-4 right-4 z-30 opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{ cursor: "default" }}>
        <button
          onClick={toggleFullscreen}
          className="p-2.5 rounded-xl backdrop-blur-sm transition-colors"
          style={{ background: t.surface, border: `1px solid ${t.border}` }}
        >
          {isFullscreen
            ? <Minimize2 size={16} style={{ color: t.sub }} />
            : <Maximize2 size={16} style={{ color: t.sub }} />}
        </button>
      </div>

      {/* Scene indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest"
        style={{ color: t.sub, opacity: 0.2 }}>
        {scene}
      </div>
    </div>
  );
}

function CountdownScene({ eventDate, eventTime, t }: { eventDate: string; eventTime: string; t: typeof THEMES[ThemeKey] }) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    const target = new Date(`${eventDate}T${eventTime}`);
    function update() {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setRemaining("Starting now"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(h > 0 ? `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s` : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [eventDate, eventTime]);
  return (
    <div className="text-center">
      <p className="text-sm uppercase tracking-[0.3em] mb-8" style={{ color: t.goldSub }}>Session begins in</p>
      <p className="font-display text-7xl md:text-9xl font-bold tabular-nums" style={{ color: t.text }}>{remaining}</p>
    </div>
  );
}

function CommunityScene({ eventId, supabase, t }: {
  eventId: string;
  supabase: ReturnType<typeof createBrowserClient>;
  t: typeof THEMES[ThemeKey];
}) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    supabase.from("registrations").select("id", { count: "exact", head: true })
      .eq("event_id", eventId).is("deleted_at", null).then(({ count: c }: { count: number | null }) => setCount(c));
  }, [eventId]);
  return (
    <div className="text-center">
      <p className="text-[11px] uppercase tracking-[0.3em] mb-8" style={{ color: t.goldSub }}>Tonight</p>
      {count !== null ? (
        <>
          <p className="font-display text-8xl md:text-[12rem] font-bold leading-none" style={{ color: t.text }}>{count}</p>
          <p className="mt-6 text-xl md:text-2xl" style={{ color: t.sub }}>people from across Nairobi</p>
        </>
      ) : <p className="font-display text-4xl" style={{ color: t.sub }}>Loading…</p>}
    </div>
  );
}
