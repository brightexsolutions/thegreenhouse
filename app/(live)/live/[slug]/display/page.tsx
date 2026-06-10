/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Maximize2, Minimize2, Music2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { AnimatePresence, motion, type Variants } from "framer-motion";

type DisplayState = {
  scene:                    string;
  song_id:                  string | null;
  verse_index:              number;
  custom_text:              string | null;
  theme:                    string;
  show_qr:                  boolean;
  featured_feedback:        string | null;
  featured_feedback_author: string | null;
  updated_at:               string;
};

type Song = {
  id:     string;
  title:  string;
  artist: string | null;
  lyrics: string | null;
};

type SessionSong = { vocalist: string | null; songs: Song | null };

type Session = {
  id:            string;
  title:         string;
  type:          string;
  sort_order:    number;
  deleted_at:    string | null;
  session_songs: Array<SessionSong>;
};

type EventImage = {
  id:         string;
  path:       string;
  sort_order: number;
};

type EventData = {
  id:                 string;
  title:              string;
  subtitle:           string | null;
  event_date:         string;
  event_time:         string;
  theme_title:        string | null;
  theme_scripture:    string | null;
  theme_description:  string | null;
  venue_name:         string | null;
  cover_image:        string | null;
  slug:               string;
  event_sessions:     Session[];
  event_images:       EventImage[];
};

const THEMES = {
  dark: {
    bg:       "#0d1a12",
    surface:  "rgba(255,255,255,0.05)",
    text:     "#f7f2e8",
    sub:      "rgba(247,242,232,0.65)",
    gold:     "#c9a24a",
    goldSub:  "rgba(201,162,74,0.75)",
    glow:     "rgba(201,162,74,0.13)",
    border:   "rgba(247,242,232,0.12)",
    qrBg:     "#1b3a2a",
    qrFg:     "#f7f2e8",
    particle: "rgba(201,162,74,0.5)",
  },
  light: {
    bg:       "#f7f2e8",
    surface:  "rgba(27,58,42,0.06)",
    text:     "#1a1a18",
    sub:      "rgba(26,26,24,0.65)",
    gold:     "#1b3a2a",
    goldSub:  "rgba(27,58,42,0.6)",
    glow:     "rgba(27,58,42,0.05)",
    border:   "rgba(27,58,42,0.14)",
    qrBg:     "#1b3a2a",
    qrFg:     "#f7f2e8",
    particle: "rgba(27,58,42,0.18)",
  },
  forest: {
    bg:       "#1b3a2a",
    surface:  "rgba(247,242,232,0.07)",
    text:     "#f7f2e8",
    sub:      "rgba(247,242,232,0.7)",
    gold:     "#c9a24a",
    goldSub:  "rgba(201,162,74,0.8)",
    glow:     "rgba(201,162,74,0.16)",
    border:   "rgba(247,242,232,0.14)",
    qrBg:     "#0d1a12",
    qrFg:     "#f7f2e8",
    particle: "rgba(201,162,74,0.4)",
  },
} as const;
type ThemeKey = keyof typeof THEMES;

function getLinesFromLyrics(lyrics: string | null) {
  if (!lyrics) return [];
  return lyrics.split(/\n{2,}/).map(v => v.trim()).filter(Boolean);
}

// Mix of tiny sparks (3–6px), mid orbs (8–14px) and large glowing orbs (20–32px)
const PARTICLE_DATA = Array.from({ length: 28 }, (_, i) => {
  const tier = i < 14 ? "spark" : i < 23 ? "orb" : "glow";
  return {
    id:   i,
    tier,
    x:    4 + (i * 3.7) % 92,
    size: tier === "spark" ? 3 + (i * 1.1) % 4
        : tier === "orb"   ? 8 + (i * 1.7) % 7
        :                    20 + (i * 2.3) % 13,
    dur:  tier === "spark" ? 12 + (i * 1.9) % 10
        : tier === "orb"   ? 18 + (i * 2.3) % 12
        :                    24 + (i * 3.1) % 16,
    del:  (i * 1.9) % 14,
    dx:   (i % 2 === 0 ? 1 : -1) * (10 + (i * 4.1) % 55),
  };
});

function Particles({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0) translateX(0);        opacity: 0;   }
          6%   { opacity: 1; }
          80%  { opacity: 0.85; }
          100% { transform: translateY(-108vh) translateX(var(--dx)); opacity: 0; }
        }
        @keyframes galleryFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-14px); }
        }
      `}</style>
      {PARTICLE_DATA.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left:       `${p.x}%`,
            bottom:     "-12px",
            width:      `${p.size}px`,
            height:     `${p.size}px`,
            background: color,
            boxShadow:  p.tier !== "spark"
              ? `0 0 ${p.tier === "glow" ? p.size * 2.5 : p.size * 1.5}px ${color}`
              : "none",
            animation:  `floatUp ${p.dur}s ${p.del}s infinite linear`,
            // @ts-expect-error custom css var
            "--dx": `${p.dx}px`,
          }}
        />
      ))}
    </div>
  );
}

// Gallery scene preset images (used when no event images are uploaded)
const GALLERY_PRESETS = [
  "https://picsum.photos/seed/gh-nature1/600/900",
  "https://picsum.photos/seed/gh-worship2/600/900",
  "https://picsum.photos/seed/gh-gather3/600/900",
  "https://picsum.photos/seed/gh-light4/600/900",
  "https://picsum.photos/seed/gh-peace5/600/900",
];

const GALLERY_SLOTS = [
  { top: "4%",  left: "4%",   rotate: -7, w: "27vw", floatDur: 5.5, del: 0    },
  { top: "6%",  left: "54%",  rotate:  5, w: "25vw", floatDur: 4.8, del: 0.3  },
  { top: "36%", left: "27%",  rotate: -2, w: "31vw", floatDur: 6.2, del: 0.6  },
  { top: "46%", left: "2%",   rotate:  6, w: "25vw", floatDur: 5.0, del: 0.15 },
  { top: "42%", left: "60%",  rotate: -5, w: "27vw", floatDur: 5.8, del: 0.45 },
];

function GalleryScene({ imageUrls, t }: { imageUrls: string[]; t: typeof THEMES[ThemeKey] }) {
  const urls = (imageUrls.length > 0 ? [...imageUrls] : [...GALLERY_PRESETS]).slice(0, 5);
  while (urls.length < 5) urls.push(GALLERY_PRESETS[urls.length % GALLERY_PRESETS.length]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Radial vignette to keep center readable */}
      <div className="absolute inset-0 z-10 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 35%, ${t.bg}BB 100%)` }} />

      {GALLERY_SLOTS.map((slot, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: slot.del + 0.1, duration: 0.9, ease: "easeOut" }}
          style={{ position: "absolute", top: slot.top, left: slot.left, width: slot.w }}
        >
          {/* Float wrapper — separate from motion so transforms don't conflict */}
          <div style={{ animation: `galleryFloat ${slot.floatDur}s ${slot.del}s ease-in-out infinite` }}>
            <div
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{ transform: `rotate(${slot.rotate}deg)` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={urls[i]}
                alt=""
                className="w-full object-cover"
                style={{ aspectRatio: "3/4", display: "block" }}
                draggable={false}
              />
              <div className="absolute inset-0"
                style={{ background: `linear-gradient(to top, ${t.bg}90, transparent 55%)` }} />
            </div>
          </div>
        </motion.div>
      ))}

      {/* Centered label */}
      <div className="absolute inset-x-0 bottom-12 text-center z-20">
        <p className="text-sm uppercase tracking-[0.5em] font-semibold" style={{ color: t.sub, opacity: 0.75 }}>
          The Green House
        </p>
      </div>
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
  const [activeVocalist, setActiveVocalist] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [galleryUrls,  setGalleryUrls] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Shared event loader — called on mount and periodically to pick up song/session changes
  async function loadEvent(eventId?: string) {
    const { data: ev } = await supabase
      .from("events")
      .select("id, title, subtitle, event_date, event_time, theme_title, theme_scripture, theme_description, venue_name, cover_image, slug, event_sessions(id, title, type, sort_order, deleted_at, session_songs(vocalist, songs(id, title, artist, lyrics))), event_images(id, path, sort_order)")
      .eq("slug", slug)
      .single();
    if (!ev) return;
    const evTyped = ev as unknown as EventData;
    evTyped.event_sessions = evTyped.event_sessions.filter(s => !s.deleted_at);
    setEvent(evTyped);

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const imgs = [...(evTyped.event_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    if (imgs.length > 0) {
      setGalleryUrls(imgs.map(img => `${baseUrl}/storage/v1/object/public/event-images/${img.path}`));
    }

    // Only load display_state on first call (no eventId means initial load)
    if (!eventId) {
      const { data: ds } = await supabase
        .from("display_state")
        .select("*")
        .eq("event_id", evTyped.id)
        .maybeSingle();
      if (ds) setDisplay(ds as DisplayState);
    }
  }

  // Load event + initial display state
  useEffect(() => {
    loadEvent();
  }, [slug]);

  // Re-fetch event data every 12s so song/session removals are detected on the display
  useEffect(() => {
    if (!event) return;
    const id = setInterval(() => loadEvent(event.id), 12000);
    return () => clearInterval(id);
  }, [event?.id]);

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
        if (!prev || prev.updated_at !== (data as DisplayState).updated_at) return data as DisplayState;
        return prev;
      });
    }, 3000);
    return () => clearInterval(id);
  }, [event?.id]);

  // Sync active song + vocalist
  useEffect(() => {
    if (!display?.song_id || !event) { setActiveSong(null); setActiveVocalist(null); return; }
    for (const sess of event.event_sessions) {
      for (const ss of sess.session_songs) {
        if (ss.songs?.id === display.song_id) {
          setActiveSong(ss.songs);
          setActiveVocalist(ss.vocalist ?? null);
          return;
        }
      }
    }
    setActiveSong(null);
    setActiveVocalist(null);
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
    } catch { /* not supported */ }
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
  // True when display_state references a song that's no longer in the session list
  const songRemoved = !!display.song_id && !activeSong;
  const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL ?? "https://greenhousews.co.ke";
  const liveUrl  = `${siteUrl}/live/${event.slug}`;
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

      {/* Floating particles — hidden during gallery to not compete with images */}
      {scene !== "gallery" && <Particles color={t.particle} />}

      {/* Gallery scene — full bleed, lives outside the padded wrapper */}
      <AnimatePresence>
        {scene === "gallery" && (
          <motion.div
            key="gallery-scene"
            className="absolute inset-0 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <GalleryScene imageUrls={galleryUrls} t={t} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scene content (all non-gallery scenes, with padding) */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-12 md:p-20">
        <AnimatePresence mode="wait">
          {scene !== "gallery" && (
            <motion.div key={scene} variants={sceneV} initial="initial" animate="animate" exit="exit"
              className="w-full flex items-center justify-center">

              {scene === "branding" && (
                <div className="text-center flex flex-col items-center gap-0">
                  <div className="text-sm uppercase tracking-[0.5em] mb-10 font-semibold" style={{ color: t.sub }}>The Green House</div>
                  <div className="font-display font-semibold leading-[1.1] mb-6" style={{ color: t.text, fontSize: "clamp(3rem,8vw,7rem)" }}>
                    Pause. Breathe.<br />Reflect. Worship.
                  </div>
                  <div className="text-lg md:text-2xl font-display font-medium mb-10" style={{ color: t.gold }}>
                    {event.title.replace("The Green House — ", "").replace("The Green House – ", "")}
                  </div>
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

              {scene === "now_playing" && (activeSong ? (
                <div className="text-center">
                  <p className="text-sm uppercase tracking-[0.45em] mb-8 font-semibold" style={{ color: t.goldSub }}>Now Playing</p>
                  <h1 className="font-display text-6xl md:text-8xl font-semibold" style={{ color: t.text }}>{activeSong.title}</h1>
                  {activeSong.artist && <p className="mt-6 text-2xl md:text-3xl" style={{ color: t.sub }}>{activeSong.artist}</p>}
                  {activeVocalist && (
                    <div className="mt-8 flex items-center justify-center gap-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-lg md:text-xl font-bold flex-shrink-0"
                        style={{ background: `${t.gold}22`, border: `1.5px solid ${t.gold}66`, color: t.gold }}>
                        {activeVocalist.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-xl md:text-3xl font-medium tracking-wide" style={{ color: t.gold }}>
                        {activeVocalist}
                      </p>
                    </div>
                  )}
                </div>
              ) : songRemoved ? (
                <SongRemovedMessage t={t} />
              ) : null)}

              {scene === "lyrics" && (songRemoved ? (
                <SongRemovedMessage t={t} />
              ) : !activeSong ? (
                /* No song selected yet */
                <div className="text-center flex flex-col items-center gap-6">
                  <Music2 size={72} style={{ color: t.border, opacity: 0.4 }} />
                  <p className="font-display text-3xl md:text-4xl font-medium" style={{ color: t.sub }}>
                    No song loaded
                  </p>
                  <p className="text-base" style={{ color: t.sub, opacity: 0.45 }}>
                    Select a song from the control panel
                  </p>
                </div>
              ) : (
                <div className="text-center max-w-5xl w-full">
                  {activeSong && (
                    <div className="mb-10 flex flex-col items-center gap-2">
                      <p className="text-sm uppercase tracking-[0.35em] font-semibold" style={{ color: t.goldSub }}>{activeSong.title}</p>
                      {activeVocalist && (
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: `${t.gold}22`, border: `1px solid ${t.gold}55`, color: t.gold }}>
                            {activeVocalist.charAt(0).toUpperCase()}
                          </div>
                          <p className="text-base md:text-lg tracking-[0.2em]" style={{ color: t.gold }}>{activeVocalist}</p>
                        </div>
                      )}
                    </div>
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
              ))}

              {scene === "program" && (
                <div className="w-full max-w-3xl">
                  <p className="text-sm md:text-base uppercase tracking-[0.45em] mb-10 text-center font-semibold"
                    style={{ color: t.gold }}>Tonight&apos;s Program</p>
                  <div className="space-y-4">
                    {[...event.event_sessions].sort((a, b) => a.sort_order - b.sort_order).map((sess, i) => (
                      <div key={sess.id} className="flex items-center gap-8 px-8 py-5 rounded-2xl"
                        style={{ border: `1px solid ${t.border}`, background: t.surface }}>
                        <span className="font-display text-4xl md:text-5xl font-bold w-12 shrink-0 text-right tabular-nums"
                          style={{ color: t.goldSub }}>{i + 1}</span>
                        <span className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold"
                          style={{ color: t.text }}>{sess.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {scene === "theme" && (
                <div className="text-center max-w-3xl">
                  <p className="text-sm uppercase tracking-[0.45em] mb-10 font-semibold" style={{ color: t.goldSub }}>Tonight&apos;s Theme</p>
                  <h1 className="font-display text-7xl md:text-9xl font-bold mb-8" style={{ color: t.text }}>{event.theme_title ?? "—"}</h1>
                  {event.theme_scripture && <p className="text-xl md:text-2xl font-display italic" style={{ color: t.gold }}>{event.theme_scripture}</p>}
                  {event.theme_description && (
                    <p className="mt-6 text-base md:text-lg max-w-xl mx-auto leading-relaxed" style={{ color: t.sub }}>{event.theme_description}</p>
                  )}
                </div>
              )}

              {scene === "prayer" && (
                <div className="text-center max-w-3xl">
                  <p className="text-sm uppercase tracking-[0.45em] mb-12 font-semibold" style={{ color: t.sub, opacity: 0.55 }}>Take a moment</p>
                  <div className="font-display text-4xl md:text-6xl font-medium leading-snug whitespace-pre-line" style={{ color: t.text }}>
                    {display.custom_text || "Close your eyes.\nBe still."}
                  </div>
                </div>
              )}

              {scene === "community" && (
                <CommunityScene slug={event.slug} t={t} />
              )}

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
          )}
        </AnimatePresence>
      </div>

      {/* Featured feedback overlay — glass chat bubble with avatar */}
      <AnimatePresence>
        {display.featured_feedback && (
          <motion.div
            key={`feedback-${display.featured_feedback.slice(0, 16)}`}
            initial={{ opacity: 0, y: 64, scale: 0.94 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{    opacity: 0, y: 32, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30, mass: 1.1 }}
            className="absolute inset-x-6 bottom-8 md:inset-x-14 md:bottom-12 z-30 flex items-end gap-4"
          >
            {/* Author avatar */}
            <div className="flex-shrink-0 mb-3">
              {display.featured_feedback_author ? (
                <div
                  className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center font-bold text-base md:text-xl"
                  style={{
                    background: avatarColor(display.featured_feedback_author)[0],
                    color:      avatarColor(display.featured_feedback_author)[1],
                    border:     `2px solid ${t.border}`,
                    boxShadow:  "0 4px 20px rgba(0,0,0,0.3)",
                  }}
                >
                  {display.featured_feedback_author.charAt(0).toUpperCase()}
                </div>
              ) : (
                <div
                  className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: t.surface,
                    border:     `2px solid ${t.border}`,
                    boxShadow:  "0 4px 20px rgba(0,0,0,0.3)",
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    style={{ width: "40%", height: "40%", color: t.sub }}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Bubble */}
            <div className="flex-1 relative">
              <div
                className="relative rounded-[2rem] rounded-bl-lg px-6 py-6 md:px-10 md:py-8 overflow-visible"
                style={{
                  background: themeKey === "light"
                    ? "rgba(255,255,255,0.6)"
                    : "rgba(255,255,255,0.08)",
                  backdropFilter:         "blur(20px) saturate(160%)",
                  WebkitBackdropFilter:   "blur(20px) saturate(160%)",
                  border: `1px solid ${t.border}`,
                  boxShadow: themeKey === "light"
                    ? "0 8px 40px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9)"
                    : `0 8px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07), 0 0 80px ${t.glow}`,
                }}
              >
                {/* Decorative open-quote */}
                <span
                  className="absolute -top-4 left-6 font-display text-7xl leading-none pointer-events-none select-none"
                  style={{ color: t.gold, opacity: 0.25 }}
                >&ldquo;</span>

                {/* Live badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#4ade80" }} />
                  <p className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: t.goldSub }}>
                    {display.featured_feedback_author ? display.featured_feedback_author : "From the room"}
                  </p>
                </div>

                {/* Word-by-word animated text */}
                <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                  {display.featured_feedback.split(" ").map((word, i) => (
                    <motion.span
                      key={`${i}-${word}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 + i * 0.055, duration: 0.4, ease: "easeOut" }}
                      className="font-display font-medium"
                      style={{ color: t.text, fontSize: "clamp(1.3rem,2.8vw,3rem)", lineHeight: 1.3 }}
                    >
                      {word}
                    </motion.span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <QRCodeSVG value={liveUrl} size={160} bgColor={t.qrBg} fgColor={t.qrFg} level="M" />
            <p className="text-[10px] uppercase tracking-widest text-center" style={{ color: t.qrFg, opacity: 0.55 }}>
              Open on your phone
            </p>
            <p className="text-[9px] font-mono" style={{ color: t.qrFg, opacity: 0.3 }}>
              Program · Lyrics · Feedback
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

function SongRemovedMessage({ t }: { t: typeof THEMES[ThemeKey] }) {
  return (
    <div className="text-center flex flex-col items-center gap-6">
      <div className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ border: `1px solid ${t.border}`, animation: "spin 18s linear infinite" }}>
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.gold, opacity: 0.5 }} />
      </div>
      <p className="font-display text-4xl md:text-6xl font-medium" style={{ color: t.text }}>
        Stay with us.
      </p>
      <p className="text-lg md:text-xl" style={{ color: t.sub }}>
        We&apos;ll be back with you shortly.
      </p>
    </div>
  );
}

function CountdownScene({ eventDate, eventTime, t }: { eventDate: string; eventTime: string; t: typeof THEMES[ThemeKey] }) {
  const [remaining, setRemaining] = useState("");
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const target = new Date(`${eventDate}T${eventTime}`);
    function update() {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setIsLive(true);
        setRemaining("");
        return;
      }
      setIsLive(false);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(h > 0
        ? `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
        : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [eventDate, eventTime]);

  if (isLive) {
    return (
      <div className="text-center flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
          <p className="text-base uppercase tracking-[0.45em] font-semibold" style={{ color: t.goldSub }}>Session is live</p>
          <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
        </div>
        <p className="font-display text-5xl md:text-7xl font-semibold" style={{ color: t.text }}>
          We&apos;re on.
        </p>
        <p className="text-base md:text-lg" style={{ color: t.sub }}>The session has begun — welcome.</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-sm uppercase tracking-[0.45em] mb-8 font-semibold" style={{ color: t.goldSub }}>Session begins in</p>
      <p className="font-display text-7xl md:text-9xl font-bold tabular-nums" style={{ color: t.text }}>{remaining}</p>
    </div>
  );
}

// Deterministic color palette for avatars — varied but always the same per person
const AVATAR_COLORS = [
  ["#1b3a2a", "#c9a24a"],  // forest / gold
  ["#2d5240", "#f7f2e8"],  // moss / cream
  ["#3a5c32", "#e4c97e"],  // deep green / gold-light
  ["#1a3340", "#7fa98a"],  // dark teal / sage
  ["#4a3a1a", "#f7f2e8"],  // bark / cream
  ["#2a1a3a", "#c9a24a"],  // deep purple / gold
  ["#1a3a38", "#e4c97e"],  // dark teal / gold
  ["#3a2a1a", "#7fa98a"],  // brown / sage
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

// Deterministic scatter positions for up to 40 avatars
function avatarPos(i: number, total: number) {
  const angle = (i / total) * Math.PI * 2 + (i % 3) * 0.4;
  const radius = 28 + (i % 5) * 6;
  const cx = 50 + radius * Math.cos(angle) * 0.85;
  const cy = 48 + radius * Math.sin(angle) * 0.7;
  const size = 44 + (i % 4) * 8;
  const floatDur = 4.5 + (i % 5) * 0.7;
  const floatDel = (i * 0.38) % 3.5;
  return { cx, cy, size, floatDur, floatDel };
}

function CommunityScene({ slug, t }: {
  slug: string;
  t: typeof THEMES[ThemeKey];
}) {
  const [attendees, setAttendees] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/live/${slug}/stats`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setAttendees((data.attendees ?? []).slice(0, 40));
      } catch { /* ignore */ }
    }

    poll();
    const id = setInterval(poll, 4000);
    return () => { cancelled = true; clearInterval(id); };
  }, [slug]);

  const count = attendees.length;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Floating avatar cloud */}
      {count > 0 && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          {attendees.map((a, i) => {
            const { cx, cy, size, floatDur, floatDel } = avatarPos(i, count);
            const [bg, fg] = avatarColor(a.first_name + a.last_name);
            return (
              <div
                key={a.id}
                className="absolute flex items-center justify-center rounded-full font-semibold"
                style={{
                  left:       `${cx}%`,
                  top:        `${cy}%`,
                  transform:  "translate(-50%, -50%)",
                  width:      `${size}px`,
                  height:     `${size}px`,
                  background: bg,
                  color:      fg,
                  fontSize:   `${size * 0.35}px`,
                  opacity:    0.55 + (i % 4) * 0.1,
                  animation:  `galleryFloat ${floatDur}s ${floatDel}s ease-in-out infinite`,
                  boxShadow:  `0 4px 16px rgba(0,0,0,0.25)`,
                  border:     `2px solid rgba(255,255,255,0.08)`,
                }}
              >
                {initials(a.first_name, a.last_name)}
              </div>
            );
          })}
        </div>
      )}

      {/* Centred count */}
      <div className="relative text-center z-10">
        <p className="text-sm uppercase tracking-[0.45em] mb-4 font-semibold" style={{ color: t.goldSub }}>In the room tonight</p>
        {count > 0 ? (
          <>
            <p className="font-display text-8xl md:text-[10rem] font-bold leading-none" style={{ color: t.text }}>{count}</p>
            <p className="mt-4 text-xl md:text-2xl" style={{ color: t.sub }}>people from across Nairobi</p>
          </>
        ) : (
          <p className="font-display text-4xl" style={{ color: t.sub }}>—</p>
        )}
      </div>
    </div>
  );
}
