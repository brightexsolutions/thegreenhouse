/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Maximize2, Minimize2, Music2, Sparkles } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { SITE_NAME } from "@/lib/constants";

type DisplayState = {
  scene:                    string;
  song_id:                  string | null;
  verse_index:              number;
  custom_text:              string | null;
  theme:                    string;
  show_qr:                  boolean;
  featured_feedback:        string | null;
  featured_feedback_author: string | null;
  trivia_round_id:          string | null;
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
  duration_min:  number | null;
  deleted_at:    string | null;
  session_songs: Array<SessionSong>;
};

type EventImage = {
  id:         string;
  path:       string;
  sort_order: number;
};

type EventData = {
  id:                  string;
  title:               string;
  subtitle:            string | null;
  event_date:          string;
  event_time:          string;
  theme_title:         string | null;
  theme_scripture:     string | null;
  theme_description:   string | null;
  venue_name:          string | null;
  cover_image:         string | null;
  highlight_video: string | null;
  slug:                string;
  event_sessions:      Session[];
  event_images:        EventImage[];
};

type TriviaRound = {
  id:            string;
  status:        "active" | "revealing" | "closed";
  question:      string;
  type:          "multiple_choice" | "open_input";
  options:       string[] | null;
  correct_index: number | null;
  timer_seconds: number | null;
  started_at:    string;
  points:        number;
  hint:          string | null;
};

type Respondent = {
  name:         string | null;
  submitted_at: string;
  is_correct:   boolean | null;
};

type TriviaResults = {
  total:       number;
  correct:     number;
  tally:       Record<number, number>;
  respondents: Respondent[];
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
        @keyframes galleryDrift {
          0%   { transform: translateY(0px)   translateX(0px); }
          20%  { transform: translateY(-10px) translateX(7px); }
          45%  { transform: translateY(-16px) translateX(2px); }
          70%  { transform: translateY(-8px)  translateX(-7px); }
          100% { transform: translateY(0px)   translateX(0px); }
        }
        @keyframes correctPulse {
          0%, 100% { box-shadow: 0 0 14px rgba(78,195,120,0.35), 0 4px 14px rgba(0,0,0,0.28); }
          50%       { box-shadow: 0 0 38px rgba(78,195,120,0.70), 0 4px 14px rgba(0,0,0,0.28); }
        }
        @keyframes wrongShake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-5px); }
          40%       { transform: translateX(5px); }
          60%       { transform: translateX(-3px); }
          80%       { transform: translateX(3px); }
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
  const NUM_SLOTS = GALLERY_SLOTS.length;

  // Full image pool — no slice. Fall back to presets only when truly empty.
  const allUrls = imageUrls.length > 0 ? imageUrls : [...GALLERY_PRESETS];
  const paddedUrls = [...allUrls];
  while (paddedUrls.length < NUM_SLOTS) paddedUrls.push(GALLERY_PRESETS[paddedUrls.length % GALLERY_PRESETS.length]);

  // Which url index each visible slot is currently showing
  const [slotIndices, setSlotIndices] = useState<number[]>(() =>
    Array.from({ length: NUM_SLOTS }, (_, i) => i % paddedUrls.length)
  );
  const nextImgRef  = useRef(NUM_SLOTS);
  const nextSlotRef = useRef(0);

  const [spotlight, setSpotlight]         = useState<number | null>(null);
  const [showcaseStyle, setShowcaseStyle] = useState<"center" | "wipe-left" | "wipe-right">("center");
  const cycleRef = useRef(0);

  // Pre-fetch every image into the browser cache on mount so slot swaps are instant
  useEffect(() => {
    const pool = imageUrls.length > 0 ? imageUrls : GALLERY_PRESETS;
    pool.forEach(url => { const img = new Image(); img.src = url; });
  }, [imageUrls]);

  // Rotate one slot's image every 3.5 s so all photos eventually appear
  useEffect(() => {
    if (paddedUrls.length <= NUM_SLOTS) return;
    const id = setInterval(() => {
      const slot   = nextSlotRef.current % NUM_SLOTS;
      const imgIdx = nextImgRef.current % paddedUrls.length;
      setSlotIndices(prev => { const n = [...prev]; n[slot] = imgIdx; return n; });
      nextSlotRef.current++;
      nextImgRef.current = (imgIdx + 1) % paddedUrls.length;
    }, 3500);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paddedUrls.length]);

  // Showcase cycle — rotates through: center spring → wipe left → wipe right → …
  useEffect(() => {
    let cancelled = false;
    function showNext() {
      if (cancelled) return;
      const n      = cycleRef.current;
      const slot   = n % NUM_SLOTS;
      const style  = (n % 3 === 0 ? "center" : n % 3 === 1 ? "wipe-left" : "wipe-right") as typeof showcaseStyle;
      cycleRef.current++;
      setShowcaseStyle(style);
      setSpotlight(slot);
      setTimeout(() => { if (!cancelled) setSpotlight(null); }, 4000);
    }
    const first    = setTimeout(showNext, 5000);
    const interval = setInterval(showNext, 11000);
    return () => { cancelled = true; clearTimeout(first); clearInterval(interval); };
  }, []);

  const spotlightUrl = spotlight !== null ? paddedUrls[slotIndices[spotlight]] : null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Radial vignette */}
      <div className="absolute inset-0 z-10 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 80% 80% at 50% 50%, transparent 35%, ${t.bg}BB 100%)` }} />

      {/* Scattered floating cards — cross-fade when their image changes */}
      {GALLERY_SLOTS.map((slot, i) => {
        const url = paddedUrls[slotIndices[i]];
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: spotlight !== null && spotlight !== i ? 0.14 : 1, scale: 1 }}
            transition={{ delay: spotlight === null ? slot.del + 0.1 : 0, duration: 0.5, ease: "easeOut" }}
            style={{ position: "absolute", top: slot.top, left: slot.left, width: slot.w }}
          >
            <div style={{ animation: `galleryDrift ${slot.floatDur}s ${slot.del}s ease-in-out infinite` }}>
              <div
                className="rounded-2xl overflow-hidden shadow-2xl relative"
                style={{ transform: `rotate(${slot.rotate}deg)`, aspectRatio: "3/4" }}
              >
                <AnimatePresence>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <motion.img
                    key={url}
                    src={url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    draggable={false}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.75 }}
                  />
                </AnimatePresence>
                <div className="absolute inset-0 z-10"
                  style={{ background: `linear-gradient(to top, ${t.bg}90, transparent 55%)` }} />
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* ── Showcase style 1: center spring ── */}
      <AnimatePresence>
        {spotlight !== null && showcaseStyle === "center" && spotlightUrl && (
          <motion.div
            key={`center-${spotlight}-${spotlightUrl}`}
            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
            style={{ background: "rgba(0,0,0,0.6)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <motion.div
              className="rounded-3xl overflow-hidden"
              style={{ width: "38vw", maxWidth: "560px", boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 32px 80px rgba(0,0,0,0.75)" }}
              initial={{ scale: 0.55, rotate: GALLERY_SLOTS[spotlight]?.rotate ?? 0, opacity: 0 }}
              animate={{ scale: 1,    rotate: 0,                                        opacity: 1 }}
              exit={{    scale: 0.65,                                                    opacity: 0 }}
              transition={{ type: "spring", stiffness: 170, damping: 22 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={spotlightUrl} alt="" className="w-full object-cover" style={{ aspectRatio: "3/4", display: "block" }} draggable={false} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Showcase style 2: wipe from left ── */}
      <AnimatePresence>
        {spotlight !== null && showcaseStyle === "wipe-left" && spotlightUrl && (
          <motion.div
            key={`wipe-left-${spotlight}-${spotlightUrl}`}
            className="absolute top-0 bottom-0 left-0 z-30 pointer-events-none overflow-hidden"
            style={{ width: "50%" }}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={spotlightUrl} alt="" className="w-full h-full object-cover" draggable={false} />
            {/* right-edge fade */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(to right, transparent 45%, rgba(0,0,0,0.9) 100%)" }} />
            {/* vignette */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 35% 50%, transparent 40%, rgba(0,0,0,0.45) 100%)" }} />
            {/* gold seam line on right edge */}
            <motion.div
              className="absolute top-0 bottom-0 right-0 w-[2px]"
              style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(201,162,74,0.55) 25%, rgba(201,162,74,0.55) 75%, transparent 100%)" }}
              initial={{ scaleY: 0, transformOrigin: "top" }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.25, duration: 0.5, ease: "easeOut" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Showcase style 3: wipe from right ── */}
      <AnimatePresence>
        {spotlight !== null && showcaseStyle === "wipe-right" && spotlightUrl && (
          <motion.div
            key={`wipe-right-${spotlight}-${spotlightUrl}`}
            className="absolute top-0 bottom-0 right-0 z-30 pointer-events-none overflow-hidden"
            style={{ width: "50%" }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={spotlightUrl} alt="" className="w-full h-full object-cover" draggable={false} />
            {/* left-edge fade */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(to left, transparent 45%, rgba(0,0,0,0.9) 100%)" }} />
            {/* vignette */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 65% 50%, transparent 40%, rgba(0,0,0,0.45) 100%)" }} />
            {/* gold seam line on left edge */}
            <motion.div
              className="absolute top-0 bottom-0 left-0 w-[2px]"
              style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(201,162,74,0.55) 25%, rgba(201,162,74,0.55) 75%, transparent 100%)" }}
              initial={{ scaleY: 0, transformOrigin: "top" }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.25, duration: 0.5, ease: "easeOut" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Site name — breathing */}
      <div className="absolute inset-x-0 bottom-12 text-center z-20">
        <motion.p
          className="text-base md:text-xl uppercase tracking-[0.5em] font-semibold"
          style={{ color: t.sub }}
          animate={{ opacity: [0.45, 0.9, 0.45] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          {SITE_NAME}
        </motion.p>
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
  const [galleryUrls,      setGalleryUrls]      = useState<string[]>([]);
  const [highlightVideoUrl, setHighlightVideoUrl] = useState<string | null>(null);
  const [communityAttendees, setCommunityAttendees] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  const [triviaRound,  setTriviaRound] = useState<TriviaRound | null>(null);
  const [triviaResults, setTriviaResults] = useState<TriviaResults | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Shared event loader — called on mount and periodically to pick up song/session changes
  async function loadEvent(eventId?: string) {
    const { data: ev } = await supabase
      .from("events")
      .select("id, title, subtitle, event_date, event_time, theme_title, theme_scripture, theme_description, venue_name, cover_image, highlight_video, slug, event_sessions(id, title, type, sort_order, duration_min, deleted_at, session_songs(vocalist, songs(id, title, artist, lyrics))), event_images(id, path, sort_order)")
      .eq("slug", slug)
      .single();
    if (!ev) return;
    const evTyped = ev as unknown as EventData;
    evTyped.event_sessions = evTyped.event_sessions.filter(s => !s.deleted_at);
    setEvent(evTyped);

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

    // Current event images (sorted by sort_order)
    const currentImgs = [...(evTyped.event_images ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(img => `${baseUrl}/storage/v1/object/public/event-images/${img.path}`);

    // Past event images — pull from all events with status = 'past'
    const { data: pastEvts } = await supabase
      .from("events")
      .select("event_images(path, sort_order)")
      .eq("status", "past")
      .is("deleted_at", null);

    const pastImgs = (pastEvts ?? []).flatMap(
      (e: { event_images: Array<{ path: string; sort_order: number }> }) =>
        [...(e.event_images ?? [])]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(img => `${baseUrl}/storage/v1/object/public/event-images/${img.path}`)
    );

    // Merge: current event first, then past event images
    const allImgs = [...currentImgs, ...pastImgs];
    if (allImgs.length > 0) {
      setGalleryUrls(allImgs);
    }

    // Highlight video: use the current event's video, fall back to the most recent past event's
    if (evTyped.highlight_video) {
      setHighlightVideoUrl(evTyped.highlight_video);
    } else {
      const { data: pastWithVideo } = await supabase
        .from("events")
        .select("highlight_video")
        .eq("status", "past")
        .not("highlight_video", "is", null)
        .is("deleted_at", null)
        .order("event_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      setHighlightVideoUrl((pastWithVideo as { highlight_video: string } | null)?.highlight_video ?? null);
    }

    // Only load display_state on first call (no eventId means initial load)
    if (!eventId) {
      const { data: ds } = await supabase
        .from("display_state")
        .select("*")
        .eq("event_id", evTyped.id)
        .maybeSingle();
      if (ds) {
        setDisplay(ds as DisplayState);
      } else {
        // No row yet — create the default so the display never hangs on the spinner.
        // Matches what the control panel's "Initialise display" button does.
        const { data: init } = await supabase
          .from("display_state")
          .upsert({
            event_id:                 evTyped.id,
            scene:                    "branding",
            song_id:                  null,
            verse_index:              0,
            custom_text:              null,
            theme:                    "dark",
            show_qr:                  false,
            featured_feedback:        null,
            featured_feedback_author: null,
            updated_at:               new Date().toISOString(),
          }, { onConflict: "event_id" })
          .select("*")
          .single();
        if (init) setDisplay(init as DisplayState);
      }
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

  // Poll community attendee count every 4s — runs at top level so data is ready when scene shows
  useEffect(() => {
    let cancelled = false;
    async function pollAttendees() {
      try {
        const res = await fetch(`/api/live/${slug}/stats`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = await res.json() as { attendees?: Array<{ id: string; first_name: string; last_name: string }> };
        setCommunityAttendees((data.attendees ?? []).slice(0, 40));
      } catch { /* ignore */ }
    }
    pollAttendees();
    const id = setInterval(pollAttendees, 2000);
    return () => { cancelled = true; clearInterval(id); };
  }, [slug]);

  // Poll trivia round + results every 5s when scene = trivia
  useEffect(() => {
    let cancelled = false;
    async function pollTrivia() {
      const roundId = display?.trivia_round_id;
      if (!roundId || display?.scene !== "trivia") { setTriviaRound(null); setTriviaResults(null); return; }
      try {
        const [roundRes, resultsRes] = await Promise.all([
          fetch(`/api/trivia/${roundId}`, { cache: "no-store" }),
          fetch(`/api/trivia/${roundId}/results`, { cache: "no-store" }),
        ]);
        if (cancelled) return;
        if (roundRes.ok)   setTriviaRound(await roundRes.json() as TriviaRound);
        if (resultsRes.ok) setTriviaResults(await resultsRes.json() as TriviaResults);
      } catch { /* ignore */ }
    }
    pollTrivia();
    const id = setInterval(pollTrivia, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [display?.trivia_round_id, display?.scene]);

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

      {/* Floating particles — hidden during gallery/highlight to not compete with imagery */}
      {scene !== "gallery" && scene !== "highlight" && <Particles color={t.particle} />}

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

      {/* Highlight video scene — cinematic fullscreen */}
      <AnimatePresence>
        {scene === "highlight" && highlightVideoUrl && (
          <motion.div
            key="highlight-scene"
            className="absolute inset-0 z-10 bg-black overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Video — full bleed */}
            <video
              key={highlightVideoUrl}
              src={highlightVideoUrl}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Film grain */}
            <div
              className="absolute inset-0 pointer-events-none mix-blend-overlay"
              style={{
                opacity: 0.1,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                backgroundSize: "160px 160px",
              }}
            />

            {/* Deep cinematic vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 90% 80% at 50% 40%, transparent 28%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.88) 100%)" }}
            />

            {/* Scanlines */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,1) 2px, rgba(0,0,0,1) 4px)" }}
            />

            {/* Faint dot grid */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.04]"
              style={{ backgroundImage: "radial-gradient(circle, #f7f2e8 1px, transparent 1px)", backgroundSize: "32px 32px" }}
            />

            {/* Gold ambient glow — top left, breathing */}
            <motion.div
              className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(201,162,74,0.22) 0%, transparent 62%)" }}
              animate={{ scale: [1, 1.18, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Forest ambient glow — bottom right, breathing */}
            <motion.div
              className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(46,90,62,0.7) 0%, transparent 68%)" }}
              animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.9, 0.6] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 3 }}
            />

            {/* Cinematic letterbox — top bar */}
            <motion.div
              className="absolute top-0 inset-x-0 z-20 pointer-events-none overflow-hidden"
              style={{ height: "9vh", background: "linear-gradient(180deg, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.88) 100%)" }}
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            >
              {/* Shimmer sweep across bar on entrance */}
              <motion.div
                className="absolute inset-y-0 pointer-events-none"
                style={{ width: "40%", background: "linear-gradient(90deg, transparent, rgba(201,162,74,0.08), transparent)" }}
                initial={{ x: "-100%" }}
                animate={{ x: "350%" }}
                transition={{ delay: 0.85, duration: 1.1, ease: "easeInOut", repeat: Infinity, repeatDelay: 3.5 }}
              />

              {/* Bar content */}
              <div className="flex items-center justify-between h-full px-10">
                {/* Left: pulsing logo mark + site name */}
                <div className="flex items-center gap-3">
                  {/* Circle mark — springs in, dot pulses forever */}
                  <motion.div
                    className="relative w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ border: "1.5px solid rgba(201,162,74,0.65)" }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.55, duration: 0.4, type: "spring", stiffness: 380, damping: 20 }}
                  >
                    <motion.div
                      className="w-2 h-2 rounded-full"
                      style={{ background: "rgba(201,162,74,0.9)" }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.9, 0.4, 0.9] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    {/* Ping ring */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ border: "1.5px solid rgba(201,162,74,0.45)" }}
                      animate={{ scale: [1, 1.9], opacity: [0.55, 0] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
                    />
                  </motion.div>

                  {/* Site name — slides from left */}
                  <motion.span
                    className="uppercase font-semibold"
                    style={{ color: "rgba(247,242,232,0.55)", fontSize: "0.65rem", letterSpacing: "0.42em" }}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.72, duration: 0.4, ease: "easeOut" }}
                  >
                    The Green House W.S
                  </motion.span>
                </div>

                {/* Right: Session badge — springs from right */}
                <motion.div
                  className="flex items-center gap-2 px-3 py-1 rounded-full"
                  style={{ background: "rgba(201,162,74,0.12)", border: "1px solid rgba(201,162,74,0.35)" }}
                  initial={{ opacity: 0, x: 16, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: 0.78, duration: 0.4, type: "spring", stiffness: 300, damping: 22 }}
                >
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: "rgba(201,162,74,0.85)" }}
                    animate={{ opacity: [0.85, 0.3, 0.85] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span
                    className="uppercase font-bold"
                    style={{ color: "rgba(201,162,74,0.9)", fontSize: "0.6rem", letterSpacing: "0.35em" }}
                  >
                    Session 01
                  </span>
                </motion.div>
              </div>

              {/* Gold ruled line at bottom of bar — draws left to right */}
              <motion.div
                className="absolute bottom-0 left-0 h-px"
                style={{ background: "linear-gradient(90deg, transparent 0%, rgba(201,162,74,0.65) 20%, rgba(201,162,74,0.4) 80%, transparent 100%)" }}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.62, duration: 0.65, ease: "easeOut" }}
              />
            </motion.div>

            {/* Downward scan sweep — passes through the frame once after bar settles */}
            <motion.div
              className="absolute inset-x-0 z-[6] pointer-events-none"
              style={{
                height: "3px",
                background: "linear-gradient(90deg, transparent 0%, rgba(201,162,74,0.22) 25%, rgba(247,242,232,0.12) 50%, rgba(201,162,74,0.22) 75%, transparent 100%)",
              }}
              initial={{ top: "9vh", opacity: 0 }}
              animate={{ top: "100%", opacity: [0, 1, 1, 0] }}
              transition={{ delay: 0.72, duration: 1.5, ease: "easeIn" }}
            />

            {/* Corner brackets — each arm draws itself (scaleX / scaleY) */}

            {/* Top-left */}
            <motion.div className="absolute z-10 pointer-events-none" style={{ top: "calc(9vh + 14px)", left: "2rem", height: "2px", width: "3rem", background: "rgba(201,162,74,0.72)", transformOrigin: "left center" }}
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.62, duration: 0.25, ease: "easeOut" }} />
            <motion.div className="absolute z-10 pointer-events-none" style={{ top: "calc(9vh + 14px)", left: "2rem", height: "3rem", width: "2px", background: "rgba(201,162,74,0.72)", transformOrigin: "top center" }}
              initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.78, duration: 0.25, ease: "easeOut" }} />

            {/* Top-right */}
            <motion.div className="absolute z-10 pointer-events-none" style={{ top: "calc(9vh + 14px)", right: "2rem", height: "2px", width: "3rem", background: "rgba(201,162,74,0.72)", transformOrigin: "right center" }}
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.66, duration: 0.25, ease: "easeOut" }} />
            <motion.div className="absolute z-10 pointer-events-none" style={{ top: "calc(9vh + 14px)", right: "2rem", height: "3rem", width: "2px", background: "rgba(201,162,74,0.72)", transformOrigin: "top center" }}
              initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.82, duration: 0.25, ease: "easeOut" }} />

            {/* Bottom-left */}
            <motion.div className="absolute z-10 pointer-events-none" style={{ bottom: "2rem", left: "2rem", height: "2px", width: "3rem", background: "rgba(201,162,74,0.72)", transformOrigin: "left center" }}
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.7, duration: 0.25, ease: "easeOut" }} />
            <motion.div className="absolute z-10 pointer-events-none" style={{ bottom: "2rem", left: "2rem", height: "3rem", width: "2px", background: "rgba(201,162,74,0.72)", transformOrigin: "bottom center" }}
              initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.86, duration: 0.25, ease: "easeOut" }} />

            {/* Bottom-right */}
            <motion.div className="absolute z-10 pointer-events-none" style={{ bottom: "2rem", right: "2rem", height: "2px", width: "3rem", background: "rgba(201,162,74,0.72)", transformOrigin: "right center" }}
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.74, duration: 0.25, ease: "easeOut" }} />
            <motion.div className="absolute z-10 pointer-events-none" style={{ bottom: "2rem", right: "2rem", height: "3rem", width: "2px", background: "rgba(201,162,74,0.72)", transformOrigin: "bottom center" }}
              initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.9, duration: 0.25, ease: "easeOut" }} />

            {/* One-shot light leak sweep */}
            <motion.div
              className="absolute inset-y-0 pointer-events-none z-[5]"
              style={{
                width: "45%",
                background: "linear-gradient(90deg, transparent 0%, rgba(247,242,232,0.055) 50%, transparent 100%)",
              }}
              initial={{ x: "-60%", opacity: 0 }}
              animate={{ x: "280%", opacity: [0, 1, 1, 0] }}
              transition={{ delay: 1.1, duration: 1.6, ease: "easeInOut" }}
            />

            {/* Cinematic bottom — deep gradient + dramatic text */}
            <div
              className="absolute inset-x-0 bottom-0 z-20 pointer-events-none flex flex-col items-center justify-end"
              style={{
                paddingBottom: "4.5vh",
                paddingTop: "18vh",
                background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.75) 25%, rgba(0,0,0,0.4) 55%, transparent 100%)",
              }}
            >
              {/* "PREVIOUSLY IN" — white, readable */}
              <motion.div
                className="flex items-center gap-5 mb-5"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.55, ease: "easeOut" }}
              >
                <motion.div
                  style={{ height: "1px", background: "rgba(201,162,74,0.75)" }}
                  initial={{ width: 0 }}
                  animate={{ width: "3rem" }}
                  transition={{ delay: 0.85, duration: 0.5, ease: "easeOut" }}
                />
                <span
                  className="uppercase font-bold"
                  style={{
                    color: "rgba(247,242,232,0.92)",
                    fontSize: "clamp(0.7rem,1.2vw,0.95rem)",
                    letterSpacing: "0.6em",
                    textShadow: "0 0 24px rgba(201,162,74,0.55), 0 2px 12px rgba(0,0,0,0.9)",
                  }}
                >
                  Previously In
                </span>
                <motion.div
                  style={{ height: "1px", background: "rgba(201,162,74,0.75)" }}
                  initial={{ width: 0 }}
                  animate={{ width: "3rem" }}
                  transition={{ delay: 0.85, duration: 0.5, ease: "easeOut" }}
                />
              </motion.div>

              {/* Main title — sweeps up */}
              <div className="overflow-hidden">
                <motion.p
                  className="font-display font-semibold text-center relative"
                  style={{
                    color: "#f7f2e8",
                    fontSize: "clamp(2.8rem,6.5vw,6rem)",
                    letterSpacing: "0.05em",
                    lineHeight: 1,
                    textShadow: "0 6px 48px rgba(0,0,0,0.9), 0 0 100px rgba(201,162,74,0.18)",
                  }}
                  initial={{ y: 72, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.85, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  {SITE_NAME}
                  {/* Gold shimmer sweep — continuous */}
                  <motion.span
                    className="absolute inset-0 pointer-events-none overflow-hidden"
                    initial={{ x: "-110%" }}
                    animate={{ x: "210%" }}
                    transition={{ delay: 1.7, duration: 1.4, ease: "easeInOut", repeat: Infinity, repeatDelay: 4 }}
                    style={{
                      background: "linear-gradient(105deg, transparent 25%, rgba(201,162,74,0.35) 50%, transparent 75%)",
                    }}
                  />
                </motion.p>
              </div>

              {/* Sub-caption */}
              <motion.p
                className="mt-4 uppercase"
                style={{
                  color: "rgba(201,162,74,0.65)",
                  fontSize: "clamp(0.55rem,0.9vw,0.75rem)",
                  letterSpacing: "0.5em",
                  textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.15, duration: 0.6 }}
              >
                Session 01 &nbsp;·&nbsp; Nairobi, Kenya
              </motion.p>
            </div>
          </motion.div>
        )}
        {scene === "highlight" && !highlightVideoUrl && (
          <motion.div
            key="highlight-missing"
            className="absolute inset-0 z-10 flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <p className="font-display text-2xl" style={{ color: t.sub }}>No highlight video set for this event.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trivia: answered-avatar cloud floating in the left/right margins */}
      <AnimatePresence>
        {scene === "trivia" && triviaRound?.status === "active" && (triviaResults?.respondents?.length ?? 0) > 0 && (
          <div key="trivia-cloud" className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 5 }} aria-hidden>
            {triviaResults!.respondents.slice(0, 14).map((r, i) => {
              const pos   = triviaAvatarPos(i);
              const label = r.name ?? "G";
              const [bg, fg] = avatarColor(r.name ?? `anon-${i}`);
              const isLeft   = pos.x < 50;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.3, y: 28 }}
                  animate={{ opacity: 0.88, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.3 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22, delay: i * 0.07 }}
                  className="absolute"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%,-50%)" }}
                >
                  <div style={{ animation: `galleryFloat ${pos.floatDur}s ${pos.floatDel}s ease-in-out infinite` }}>
                    <div className="flex items-center gap-1.5" style={{ flexDirection: isLeft ? "row" : "row-reverse" }}>
                      {/* Avatar */}
                      <div
                        className="rounded-full flex items-center justify-center font-bold flex-shrink-0"
                        style={{
                          width: pos.size, height: pos.size,
                          background: bg, color: fg,
                          fontSize: Math.round(pos.size * 0.38),
                          boxShadow: "0 4px 18px rgba(0,0,0,0.32)",
                          border: "2px solid rgba(255,255,255,0.10)",
                        }}
                      >
                        {label.charAt(0).toUpperCase()}
                      </div>
                      {/* Chat bubble */}
                      <div
                        className="rounded-full text-[9px] font-bold whitespace-nowrap px-2 py-0.5"
                        style={{
                          background: "rgba(78,195,120,0.18)",
                          border: "1px solid rgba(78,195,120,0.38)",
                          color: "#4ec378",
                        }}
                      >
                        ✓ in
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Scene content (all non-gallery/highlight scenes, with padding) */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-12 md:p-20">
        <AnimatePresence mode="wait">
          {scene !== "gallery" && scene !== "highlight" && (
            <motion.div key={scene} variants={sceneV} initial="initial" animate="animate" exit="exit"
              className="w-full flex items-center justify-center">

              {scene === "branding" && (
                <div className="text-center flex flex-col items-center gap-0">
                  <div className="text-base md:text-xl uppercase tracking-[0.5em] mb-10 font-semibold" style={{ color: t.sub }}>The Green House</div>
                  <div className="font-display font-semibold leading-[1.1] mb-6" style={{ color: t.text, fontSize: "clamp(3rem,8vw,7rem)" }}>
                    Pause. Breathe.<br />Reflect. Worship.
                  </div>
                  <div className="text-2xl md:text-4xl font-display font-medium mb-10" style={{ color: t.gold }}>
                    {event.title.replace("The Green House — ", "").replace("The Green House – ", "")}
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xl md:text-2xl" style={{ color: t.sub }}>{formattedDate}</p>
                    {event.venue_name && <p className="text-lg md:text-xl" style={{ color: t.sub, opacity: 0.55 }}>{event.venue_name}</p>}
                    {event.subtitle && <p className="text-lg italic mt-1" style={{ color: t.sub, opacity: 0.5 }}>{event.subtitle}</p>}
                  </div>
                </div>
              )}

              {scene === "countdown" && (
                <CountdownScene eventDate={event.event_date} eventTime={event.event_time} sessions={event.event_sessions} t={t} />
              )}

              {scene === "now_playing" && (activeSong ? (
                <div className="text-center">
                  <p className="text-lg md:text-2xl uppercase tracking-[0.45em] mb-8 font-semibold" style={{ color: t.goldSub }}>Now Playing</p>
                  <h1 className="font-display text-6xl md:text-8xl font-semibold" style={{ color: t.text }}>{activeSong.title}</h1>
                  {activeSong.artist && <p className="mt-6 text-3xl md:text-5xl" style={{ color: t.sub }}>{activeSong.artist}</p>}
                  {activeVocalist && (
                    <div className="mt-8 flex items-center justify-center gap-4">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-xl md:text-2xl font-bold flex-shrink-0"
                        style={{ background: `${t.gold}22`, border: `1.5px solid ${t.gold}66`, color: t.gold }}>
                        {activeVocalist.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-2xl md:text-4xl font-medium tracking-wide" style={{ color: t.gold }}>
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
                    <div className="mb-10 flex flex-col items-center gap-3">
                      <p className="text-xl md:text-2xl uppercase tracking-[0.35em] font-semibold" style={{ color: t.goldSub }}>{activeSong.title}</p>
                      {activeVocalist && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
                            style={{ background: `${t.gold}22`, border: `1px solid ${t.gold}55`, color: t.gold }}>
                            {activeVocalist.charAt(0).toUpperCase()}
                          </div>
                          <p className="text-2xl md:text-3xl tracking-[0.2em]" style={{ color: t.gold }}>{activeVocalist}</p>
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
                  <p className="text-xl md:text-2xl uppercase tracking-[0.45em] mb-10 text-center font-semibold"
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
                  <p className="text-xl md:text-2xl uppercase tracking-[0.45em] mb-10 font-semibold" style={{ color: t.goldSub }}>Tonight&apos;s Theme</p>
                  <h1 className="font-display text-7xl md:text-9xl font-bold mb-8" style={{ color: t.text }}>{event.theme_title ?? "—"}</h1>
                  {event.theme_scripture && <p className="text-2xl md:text-4xl font-display italic" style={{ color: t.gold }}>{event.theme_scripture}</p>}
                  {event.theme_description && (
                    <p className="mt-6 text-xl md:text-2xl max-w-xl mx-auto leading-relaxed" style={{ color: t.sub }}>{event.theme_description}</p>
                  )}
                </div>
              )}

              {scene === "prayer" && (
                <div className="text-center max-w-3xl">
                  <p className="text-xl md:text-2xl uppercase tracking-[0.45em] mb-12 font-semibold" style={{ color: t.sub, opacity: 0.55 }}>Take a moment</p>
                  <div className="font-display text-4xl md:text-6xl font-medium leading-snug whitespace-pre-line" style={{ color: t.text }}>
                    {display.custom_text || "Close your eyes.\nBe still."}
                  </div>
                </div>
              )}

              {scene === "community" && (
                <CommunityScene attendees={communityAttendees} t={t} />
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

              {scene === "trivia" && (
                <TriviaScene
                  round={triviaRound}
                  results={triviaResults}
                  liveUrl={liveUrl}
                  t={t}
                  isFinalLeaderboard={display.custom_text === "__final_leaderboard__" && !display.trivia_round_id}
                  eventId={event?.id ?? null}
                />
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
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#4ade80" }} />
                  <p className="text-sm md:text-base uppercase tracking-[0.4em] font-semibold" style={{ color: t.goldSub }}>
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
            <p className="text-[11px] font-bold text-center tracking-wide" style={{ color: t.qrFg, opacity: 0.85 }}>
              {liveUrl.replace(/^https?:\/\//, "")}
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

type SessionTimer = {
  title:       string;
  timeStr:     string;   // "MM:SS"
  progressPct: number;   // 0–100, how much of the session has elapsed
  isComplete:  boolean;
};

function CountdownScene({
  eventDate, eventTime, sessions, t,
}: {
  eventDate: string;
  eventTime: string;
  sessions:  Session[];
  t:         typeof THEMES[ThemeKey];
}) {
  const [remaining,     setRemaining]     = useState("");
  const [isLive,        setIsLive]        = useState(false);
  const [sessionTimer,  setSessionTimer]  = useState<SessionTimer | null>(null);

  // Use a ref so the interval always sees the latest sessions without restarting
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;

  useEffect(() => {
    const target = new Date(`${eventDate}T${eventTime}`);

    function update() {
      const now  = Date.now();
      const diff = target.getTime() - now;

      if (diff > 0) {
        // Pre-event countdown
        setIsLive(false);
        setSessionTimer(null);
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setRemaining(h > 0
          ? `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
          : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
        return;
      }

      // Event is live — compute current session timer
      setIsLive(true);
      setRemaining("");

      const elapsedMs = now - target.getTime();

      const timed = sessionsRef.current
        .filter(s => !s.deleted_at && (s.duration_min ?? 0) > 0)
        .sort((a, b) => a.sort_order - b.sort_order);

      if (timed.length === 0) { setSessionTimer(null); return; }

      let accMs = 0;
      for (const sess of timed) {
        const durMs = sess.duration_min! * 60 * 1000;
        if (elapsedMs < accMs + durMs) {
          const sessElapsedMs   = elapsedMs - accMs;
          const sessRemainingMs = durMs - sessElapsedMs;
          const rm = Math.floor(sessRemainingMs / 60000);
          const rs = Math.floor((sessRemainingMs % 60000) / 1000);
          setSessionTimer({
            title:       sess.title,
            timeStr:     `${String(rm).padStart(2, "0")}:${String(rs).padStart(2, "0")}`,
            progressPct: Math.min(100, (sessElapsedMs / durMs) * 100),
            isComplete:  false,
          });
          return;
        }
        accMs += durMs;
      }

      // All sessions done
      setSessionTimer({ title: "Program complete", timeStr: "—", progressPct: 100, isComplete: true });
    }

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [eventDate, eventTime]);

  // ── Pre-event ──
  if (!isLive) {
    return (
      <div className="text-center">
        <p className="text-xl md:text-2xl uppercase tracking-[0.45em] mb-8 font-semibold" style={{ color: t.goldSub }}>
          Session begins in
        </p>
        <p className="font-display text-7xl md:text-9xl font-bold tabular-nums" style={{ color: t.text }}>
          {remaining}
        </p>
      </div>
    );
  }

  // ── Live, no session durations set ──
  if (!sessionTimer) {
    return (
      <div className="text-center flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
          <p className="text-xl md:text-2xl uppercase tracking-[0.45em] font-semibold" style={{ color: t.goldSub }}>
            Session is live
          </p>
          <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
        </div>
        <p className="font-display text-5xl md:text-7xl font-semibold" style={{ color: t.text }}>
          We&apos;re on.
        </p>
        <p className="text-xl md:text-2xl" style={{ color: t.sub }}>
          The session has begun — welcome.
        </p>
      </div>
    );
  }

  // ── Live, session timer active ──
  return (
    <div className="text-center flex flex-col items-center gap-8 max-w-3xl w-full">

      {/* Live badge */}
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
        <p className="text-base md:text-lg uppercase tracking-[0.45em] font-semibold" style={{ color: t.goldSub }}>
          {sessionTimer.isComplete ? "Program complete" : "Now in session"}
        </p>
        <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
      </div>

      {/* Session name */}
      {!sessionTimer.isComplete && (
        <h1
          className="font-display font-semibold leading-tight"
          style={{ color: t.text, fontSize: "clamp(2.5rem,6vw,5rem)" }}
        >
          {sessionTimer.title}
        </h1>
      )}

      {/* Timer */}
      {!sessionTimer.isComplete && (
        <div>
          <p className="text-sm uppercase tracking-[0.45em] mb-4 font-semibold" style={{ color: t.goldSub }}>
            Time remaining
          </p>
          <p
            className="font-display font-bold tabular-nums"
            style={{ color: t.text, fontSize: "clamp(4rem,10vw,9rem)", lineHeight: 1 }}
          >
            {sessionTimer.timeStr}
          </p>
        </div>
      )}

      {/* Progress bar */}
      {!sessionTimer.isComplete && (
        <div className="w-72 md:w-[28rem]">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: t.surface }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(to right, ${t.gold}, ${t.goldSub})` }}
              animate={{ width: `${sessionTimer.progressPct}%` }}
              transition={{ duration: 0.8, ease: "linear" }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] uppercase tracking-widest" style={{ color: t.sub, opacity: 0.5 }}>Start</span>
            <span className="text-[10px] uppercase tracking-widest" style={{ color: t.sub, opacity: 0.5 }}>End</span>
          </div>
        </div>
      )}

      {/* Complete state */}
      {sessionTimer.isComplete && (
        <p className="font-display text-5xl md:text-7xl font-semibold" style={{ color: t.text }}>
          Thank you.
        </p>
      )}
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

// Which avatars get a bubble — every 3rd one, staggered so they don't all show at once
function bubbleDelay(i: number) { return 2 + (i * 4.7) % 18; }
function bubbleDur(i: number)   { return 3.5 + (i * 1.3) % 3; }

// Scatter positions for trivia "answered" avatars — left + right margins only
function triviaAvatarPos(i: number) {
  const isLeft  = i % 2 === 0;
  const sideI   = Math.floor(i / 2);
  const x       = isLeft
    ? 2  + (sideI % 5) * 3.5          // 2 → 16% from left edge
    : 83 + (sideI % 4) * 3.8;         // 83 → 95% (right edge)
  const y       = 8 + ((sideI * 22) + (isLeft ? 0 : 11)) % 74;
  const size    = 40 + (i % 4) * 8;   // 40–64 px
  const floatDur = 4 + (i % 5) * 0.9;
  const floatDel = (i * 0.6) % 4.2;
  return { x, y, size, floatDur, floatDel };
}

const OPTION_COLORS_DISPLAY = [
  { bg: "rgba(201,162,74,0.18)",  border: "rgba(201,162,74,0.55)",  text: "#c9a24a",  fill: "#c9a24a"  },
  { bg: "rgba(78,195,120,0.15)",  border: "rgba(78,195,120,0.5)",   text: "#4ec378",  fill: "#4ec378"  },
  { bg: "rgba(99,179,237,0.15)",  border: "rgba(99,179,237,0.5)",   text: "#63b3ed",  fill: "#63b3ed"  },
  { bg: "rgba(245,101,101,0.15)", border: "rgba(245,101,101,0.5)",  text: "#f56565",  fill: "#f56565"  },
];

function TriviaScene({
  round, results, liveUrl, t, isFinalLeaderboard, eventId,
}: {
  round:               TriviaRound | null;
  results:             TriviaResults | null;
  liveUrl:             string;
  t:                   typeof THEMES[ThemeKey];
  isFinalLeaderboard?: boolean;
  eventId?:            string | null;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [finalData, setFinalData] = useState<{
    rankings: { name: string; correct: number; rank: number }[];
    totalPlayers: number;
    totalRounds: number;
  } | null>(null);

  // Timer counting up from start
  useEffect(() => {
    if (!round?.started_at) return;
    const start = new Date(round.started_at).getTime();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [round?.started_at]);

  // Confetti burst on reveal or close
  useEffect(() => {
    if (round?.status === "revealing" || round?.status === "closed") {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [round?.status]);

  // Fetch aggregate data when final leaderboard is triggered
  useEffect(() => {
    if (!isFinalLeaderboard || !eventId) return;
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 6000);
    fetch(`/api/trivia/final?event_id=${eventId}`)
      .then(r => r.json())
      .then(d => setFinalData(d))
      .catch(() => {});
  }, [isFinalLeaderboard, eventId]);

  const isRevealing  = round?.status === "revealing";
  const isClosed     = round?.status === "closed";
  const totalVotes   = results?.total ?? 0;
  const tally        = results?.tally ?? {};
  const timerLeft    = round?.timer_seconds ? Math.max(0, round.timer_seconds - elapsed) : null;
  const timerPct     = round?.timer_seconds ? (timerLeft! / round.timer_seconds) * 100 : null;

  // Final leaderboard — aggregate across all rounds
  if (isFinalLeaderboard) {
    return (
      <TriviaFinalLeaderboard
        data={finalData}
        t={t}
        showConfetti={showConfetti}
      />
    );
  }

  if (!round) {
    return (
      <div className="text-center flex flex-col items-center gap-5">
        <Sparkles size={60} style={{ color: t.gold, opacity: 0.3 }} />
        <p className="font-display text-4xl font-medium" style={{ color: t.sub }}>Trivia loading…</p>
      </div>
    );
  }

  // When round is closed → per-question leaderboard celebration
  if (isClosed) {
    return (
      <TriviaLeaderboardCelebration
        respondents={results?.respondents ?? []}
        results={results}
        t={t}
        showConfetti={showConfetti}
      />
    );
  }

  return (
    <div className="w-full max-w-5xl flex flex-col items-center gap-8">
      {/* Confetti burst on reveal */}
      {showConfetti && <ConfettiBurst color={t.gold} />}

      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: `${t.gold}22`, border: `1px solid ${t.gold}44` }}>
            <Sparkles size={12} style={{ color: t.gold }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: t.gold }}>Trivia</span>
          </div>
          {!isRevealing && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(78,195,120,0.15)", border: "1px solid rgba(78,195,120,0.3)" }}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-semibold" style={{ color: "#4ec378" }}>
                {totalVotes} answered
              </span>
            </div>
          )}
          {isRevealing && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(201,162,74,0.15)", border: "1px solid rgba(201,162,74,0.3)" }}>
              <span className="text-xs font-bold" style={{ color: t.gold }}>
                {round.type === "open_input"
                  ? `${totalVotes} response${totalVotes !== 1 ? "s" : ""} received`
                  : `${results?.correct ?? 0} / ${totalVotes} got it right`
                }
              </span>
            </div>
          )}
        </div>

        {/* Timer bar */}
        {timerLeft !== null && !isRevealing && (
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 rounded-full overflow-hidden" style={{ background: t.surface }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${timerPct}%`, background: timerPct! > 30 ? t.gold : "#f56565" }} />
            </div>
            <span className="text-lg font-bold tabular-nums" style={{ color: timerPct! > 30 ? t.gold : "#f56565" }}>
              {timerLeft}s
            </span>
          </div>
        )}
      </div>

      {/* Question */}
      <div className="text-center px-4">
        <h1 className="font-display font-semibold leading-tight"
          style={{ color: t.text, fontSize: "clamp(1.8rem,4.5vw,4rem)" }}>
          {round.question}
        </h1>
        {round.hint && !isRevealing && (
          <p className="mt-3 text-sm md:text-base italic" style={{ color: t.sub, opacity: 0.55 }}>
            Hint: {round.hint}
          </p>
        )}
      </div>

      {/* Options grid — MC */}
      {round.type === "multiple_choice" && round.options && (
        <div className="grid grid-cols-2 gap-4 w-full">
          {round.options.map((opt, i) => {
            const col        = OPTION_COLORS_DISPLAY[i % 4];
            const isCorrect  = isRevealing && i === round.correct_index;
            const isWrong    = isRevealing && i !== round.correct_index;
            const votes      = tally[i] ?? 0;
            const pct        = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const LABELS     = ["A", "B", "C", "D"];

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: isWrong ? 0.3 : 1, scale: 1 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="relative rounded-2xl overflow-hidden flex items-center gap-4 px-5 py-4"
                style={{
                  background:  isCorrect ? "rgba(78,195,120,0.2)" : col.bg,
                  border:      `2px solid ${isCorrect ? "#4ec378" : col.border}`,
                  boxShadow:   isCorrect ? "0 0 40px rgba(78,195,120,0.3)" : "none",
                  transition:  "all 0.5s ease",
                }}
              >
                {/* Result bar */}
                {isRevealing && (
                  <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                      className="absolute inset-y-0 left-0"
                      style={{ background: isCorrect ? "rgba(78,195,120,0.15)" : "rgba(255,255,255,0.04)" }}
                    />
                  </div>
                )}

                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 relative z-10"
                  style={{
                    background: isCorrect ? "#4ec378" : col.bg,
                    color:      isCorrect ? "#fff" : col.text,
                    border:     `1.5px solid ${isCorrect ? "#4ec378" : col.border}`,
                  }}>
                  {isCorrect ? "✓" : LABELS[i]}
                </div>

                <p className="font-display text-xl md:text-2xl font-medium flex-1 relative z-10"
                  style={{ color: isCorrect ? "#4ec378" : t.text }}>
                  {opt}
                </p>

                {isRevealing && (
                  <span className="text-base md:text-lg font-bold tabular-nums relative z-10"
                    style={{ color: isCorrect ? "#4ec378" : t.sub }}>
                    {pct}%
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Open input — just show "answer on your phone" */}
      {round.type === "open_input" && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-xl md:text-2xl font-display" style={{ color: t.sub }}>
            Open your phone and share your answer
          </p>
          {isRevealing && (
            <p className="text-2xl md:text-3xl font-display font-semibold" style={{ color: t.gold }}>
              {totalVotes} response{totalVotes !== 1 ? "s" : ""} received
            </p>
          )}
        </div>
      )}

      {/* QR + scan prompt */}
      {!isRevealing && (
        <div className="flex items-center gap-6 mt-2">
          <div className="flex flex-col items-center gap-2 rounded-2xl p-4"
            style={{ background: t.qrBg, border: `1px solid ${t.border}` }}>
            <QRCodeSVG value={liveUrl} size={110} bgColor={t.qrBg} fgColor={t.qrFg} level="M" />
            <p className="text-[9px] uppercase tracking-widest text-center font-medium"
              style={{ color: t.qrFg, opacity: 0.55 }}>
              Scan to answer
            </p>
          </div>
          <div>
            <p className="text-base md:text-lg font-display font-medium" style={{ color: t.sub }}>
              Haven&apos;t joined yet?
            </p>
            <p className="text-sm mb-3" style={{ color: t.sub, opacity: 0.5 }}>
              Scan the QR or visit the live page<br />to participate in trivia
            </p>
            <p className="text-xs mb-1" style={{ color: t.sub, opacity: 0.45 }}>
              Or type the link below on your browser:
            </p>
            <p className="text-sm font-bold tracking-wide break-all"
              style={{ color: t.sub, opacity: 0.9 }}>
              {liveUrl.replace(/^https?:\/\//, "")}
            </p>
          </div>
        </div>
      )}

      {/* Reveal: top-5 podium + summary counts */}
      {isRevealing && round && (
        <TriviaRevealPodium
          respondents={results?.respondents ?? []}
          results={results}
          round={round}
          t={t}
        />
      )}
    </div>
  );
}

function ConfettiBurst({ color }: { color: string }) {
  const pieces = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    angle: Math.random() * 360,
    dur: 1.5 + Math.random() * 1.5,
    del: Math.random() * 0.6,
    size: 6 + Math.random() * 10,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map(p => (
        <div key={p.id} className="absolute rounded-sm"
          style={{
            left:      `${p.x}%`,
            top:       0,
            width:     `${p.size}px`,
            height:    `${p.size * 0.5}px`,
            background: p.id % 3 === 0 ? color : p.id % 3 === 1 ? "#4ec378" : "#f7f2e8",
            transform: `rotate(${p.angle}deg)`,
            animation: `confettiFall ${p.dur}s ${p.del}s linear forwards`,
          }} />
      ))}
    </div>
  );
}

const RANK_COLORS = [
  "#c9a24a",                    // 1st — gold
  "rgba(200,208,216,0.85)",     // 2nd — silver
  "rgba(180,125,70,0.85)",      // 3rd — bronze
  "rgba(255,255,255,0.18)",     // 4th
  "rgba(255,255,255,0.18)",     // 5th
];
const RANK_TEXT = ["#1b3a2a", "#1b3a2a", "#1b3a2a", "rgba(247,242,232,0.5)", "rgba(247,242,232,0.5)"];

function TriviaRevealPodium({
  respondents, results, round, t,
}: {
  respondents: Respondent[];
  results:     TriviaResults | null;
  round:       TriviaRound;
  t:           typeof THEMES[ThemeKey];
}) {
  const top5       = respondents.slice(0, 5);
  const totalVotes = results?.total ?? 0;
  const isMC       = round.type === "multiple_choice";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28, duration: 0.5, ease: "easeOut" }}
      className="w-full space-y-5"
    >
      {/* "First to answer" label */}
      {top5.length > 0 && (
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.05em" }}
          animate={{ opacity: 1, letterSpacing: "0.38em" }}
          transition={{ delay: 0.32, duration: 0.6 }}
          className="text-center text-[10px] uppercase font-bold"
          style={{ color: t.goldSub }}
        >
          ⚡ First to answer
        </motion.p>
      )}

      {/* Avatar row */}
      <div className="flex justify-center items-end gap-5 md:gap-8">
        {top5.map((r, i) => {
          const label   = r.name || "Guest";
          const [bg, fg] = avatarColor(r.name ?? `anon-${i}`);
          const sz       = i === 0 ? 68 : i < 3 ? 56 : 46;
          const correct  = r.is_correct;
          const isWrong  = isMC && correct === false;
          const isRight  = isMC && correct === true;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.25, y: 36 }}
              animate={isWrong
                ? { opacity: 0.42, scale: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }
                : {
                    opacity: 1,
                    scale:   [0.25, 1.18, 0.92, 1.06, 1],
                    y:       0,
                  }
              }
              transition={isWrong
                ? { delay: 0.5 + i * 0.13, duration: 0.45, ease: "easeOut" }
                : {
                    delay:    0.5 + i * 0.13,
                    duration: 0.62,
                    times:    [0, 0.5, 0.72, 0.88, 1],
                    ease:     "easeOut",
                  }
              }
              className="flex flex-col items-center gap-1.5"
            >
              {/* Rank chip */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.56 + i * 0.13, type: "spring", stiffness: 420, damping: 22 }}
                className="rounded-full flex items-center justify-center font-bold"
                style={{
                  width: 20, height: 20, fontSize: 9,
                  background: RANK_COLORS[i],
                  color:      RANK_TEXT[i],
                  boxShadow:  i === 0 ? `0 0 12px ${t.gold}88` : "none",
                }}
              >
                {i + 1}
              </motion.div>

              {/* Avatar circle */}
              <div
                className="relative rounded-full flex items-center justify-center font-bold"
                style={{
                  width:     sz,
                  height:    sz,
                  background: isWrong ? "rgba(40,40,40,0.75)" : bg,
                  color:      isWrong ? "rgba(255,255,255,0.3)" : fg,
                  fontSize:   Math.round(sz * 0.36),
                  border:     i === 0 && !isWrong
                    ? `2.5px solid ${t.gold}`
                    : "2px solid rgba(255,255,255,0.10)",
                  animation:  isRight
                    ? `correctPulse 2.6s ${0.82 + i * 0.13}s ease-in-out infinite`
                    : isWrong
                    ? `wrongShake 0.45s ${0.5 + i * 0.13}s ease-out 1`
                    : undefined,
                  boxShadow:  isRight
                    ? `0 0 28px rgba(78,195,120,0.45), 0 4px 14px rgba(0,0,0,0.3)`
                    : i === 0
                    ? `0 0 20px ${t.gold}44, 0 4px 14px rgba(0,0,0,0.3)`
                    : "0 4px 12px rgba(0,0,0,0.25)",
                }}
              >
                {label.charAt(0).toUpperCase()}

                {/* ✓ / ✗ badge (MC only) */}
                {isMC && correct !== null && (
                  <motion.div
                    initial={{ scale: 0, rotate: -50 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.8 + i * 0.13, type: "spring", stiffness: 480, damping: 18 }}
                    className="absolute -bottom-1 -right-1 rounded-full flex items-center justify-center font-bold"
                    style={{
                      width:      22,
                      height:     22,
                      fontSize:   12,
                      background: correct ? "#4ec378" : "#ef4444",
                      border:     "1.5px solid rgba(0,0,0,0.22)",
                      color:      "#fff",
                    }}
                  >
                    {correct ? "✓" : "✗"}
                  </motion.div>
                )}
              </div>

              {/* Name label */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: isWrong ? 0.38 : 1 }}
                transition={{ delay: 0.68 + i * 0.13 }}
                className="text-center font-medium leading-tight"
                style={{ color: t.text, fontSize: i === 0 ? 13 : 11, maxWidth: 76 }}
              >
                {label.length > 10 ? `${label.slice(0, 9)}…` : label}
              </motion.p>
            </motion.div>
          );
        })}
      </div>

      {/* Correct / wrong summary counts */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.96 }}
        className="flex items-center justify-center gap-5"
      >
        {isMC ? (
          <>
            <div
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl"
              style={{ background: "rgba(78,195,120,0.15)", border: "1px solid rgba(78,195,120,0.32)" }}
            >
              <span className="text-3xl md:text-4xl font-bold tabular-nums" style={{ color: "#4ec378" }}>
                {results?.correct ?? 0}
              </span>
              <span className="text-sm md:text-base font-semibold" style={{ color: "#4ec378", opacity: 0.88 }}>
                correct
              </span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: t.border, opacity: 0.5 }} />
            <div
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.26)" }}
            >
              <span className="text-3xl md:text-4xl font-bold tabular-nums" style={{ color: "#f87171" }}>
                {totalVotes - (results?.correct ?? 0)}
              </span>
              <span className="text-sm md:text-base font-semibold" style={{ color: "#f87171", opacity: 0.88 }}>
                wrong
              </span>
            </div>
          </>
        ) : (
          <p className="text-xl md:text-2xl font-display font-semibold" style={{ color: t.sub }}>
            {totalVotes} response{totalVotes !== 1 ? "s" : ""} shared
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

const RANK_MEDALS = ["🥇", "🥈", "🥉", "4th", "5th"];
const RANK_SIZES  = [128, 104, 96, 80, 80];

function TriviaFinalLeaderboard({
  data, t, showConfetti,
}: {
  data:         { rankings: { name: string; correct: number; rank: number }[]; totalPlayers: number; totalRounds: number } | null;
  t:            typeof THEMES[ThemeKey];
  showConfetti: boolean;
}) {
  const rankings = data?.rankings ?? [];
  return (
    <div className="relative w-full flex flex-col items-center gap-8 px-4">
      {showConfetti && (
        <>
          <ConfettiBurst color={t.gold} />
          <ConfettiBurst color="#4ec378" />
          <ConfettiBurst color="#f7f2e8" />
        </>
      )}

      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-2xl animate-[floatUp_3s_ease-in-out_infinite]"
            style={{
              left:             `${5 + (i * 4.8) % 90}%`,
              top:              `${10 + (i * 7.3) % 70}%`,
              animationDelay:   `${(i * 0.35) % 3}s`,
              animationDuration:`${2.5 + (i % 3) * 0.5}s`,
              opacity:          0.18,
            }}
          >
            {["🌟", "✨", "⭐", "💫"][i % 4]}
          </div>
        ))}
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="text-5xl md:text-7xl mb-3">🏆</div>
        <p className="font-display text-4xl md:text-6xl font-bold" style={{ color: t.gold }}>Trivia Over!</p>
        {data && (
          <p className="text-base md:text-lg mt-2" style={{ color: t.sub }}>
            {data.totalRounds} question{data.totalRounds !== 1 ? "s" : ""} · {data.totalPlayers} player{data.totalPlayers !== 1 ? "s" : ""}
          </p>
        )}
      </motion.div>

      {/* Rankings */}
      {rankings.length === 0 ? (
        <p className="text-xl font-display" style={{ color: t.sub }}>No correct answers yet</p>
      ) : (
        <div className="w-full max-w-2xl space-y-3">
          {rankings.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 + 0.3, type: "spring", stiffness: 200 }}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl"
              style={{
                background: i === 0 ? "rgba(201,162,74,0.18)" : "rgba(255,255,255,0.06)",
                border:     i === 0 ? `1px solid ${t.gold}55` : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span className="text-2xl w-8 text-center flex-shrink-0">{RANK_MEDALS[i] ?? `${i + 1}.`}</span>
              <p className="flex-1 font-display text-xl md:text-2xl font-semibold truncate" style={{ color: i === 0 ? t.gold : t.text }}>
                {r.name}
              </p>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-2xl md:text-3xl font-bold tabular-nums" style={{ color: i === 0 ? t.gold : "#4ec378" }}>
                  {r.correct}
                </span>
                <span className="text-sm" style={{ color: t.sub }}>correct</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function TriviaLeaderboardCelebration({
  respondents, results, t, showConfetti,
}: {
  respondents: Respondent[];
  results:     TriviaResults | null;
  t:           typeof THEMES[ThemeKey];
  showConfetti: boolean;
}) {
  const top5       = respondents.slice(0, 5);
  const totalVotes = results?.total ?? 0;
  const correct    = results?.correct ?? 0;
  const wrong      = totalVotes - correct;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center gap-0 overflow-hidden">
      {/* Multi-source confetti */}
      {showConfetti && (
        <>
          <ConfettiBurst color={t.gold} />
          <ConfettiBurst color="#4ec378" />
          <ConfettiBurst color="#f7f2e8" />
        </>
      )}

      {/* Floating stars background */}
      <style>{`
        @keyframes floatUp {
          0%   { opacity: 0; transform: translateY(0) scale(0.5) rotate(0deg); }
          20%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(-80vh) scale(1.2) rotate(360deg); }
        }
        @keyframes celebPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 30px rgba(201,162,74,0.5); }
          50%       { transform: scale(1.06); box-shadow: 0 0 55px rgba(201,162,74,0.8); }
        }
      `}</style>
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="absolute pointer-events-none select-none text-xl"
          style={{
            left:      `${5 + (i * 5.8) % 92}%`,
            bottom:    `${(i * 37) % 30}%`,
            opacity:   0,
            animation: `floatUp ${3 + (i % 4)}s ${(i * 0.4) % 3}s ease-in-out infinite`,
          }}>
          {["✨", "⭐", "🌟", "💫"][i % 4]}
        </div>
      ))}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="flex flex-col items-center gap-2 mb-8"
      >
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-full"
          style={{ background: `${t.gold}22`, border: `1.5px solid ${t.gold}55` }}>
          <span className="text-2xl">🏆</span>
          <span className="font-bold uppercase tracking-[0.25em] text-lg md:text-xl"
            style={{ color: t.gold }}>Round Over!</span>
          <span className="text-2xl">🏆</span>
        </div>
        {top5.length > 0 && (
          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.04em" }}
            animate={{ opacity: 1, letterSpacing: "0.35em" }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="text-sm uppercase font-semibold"
            style={{ color: t.goldSub }}
          >
            ⚡ First to get it right
          </motion.p>
        )}
      </motion.div>

      {/* Leaderboard avatar row */}
      {top5.length > 0 ? (
        <div className="flex justify-center items-end gap-6 md:gap-10 mb-8">
          {top5.map((r, i) => {
            const label      = r.name || "Guest";
            const [bg, fg]   = avatarColor(r.name ?? `anon-${i}`);
            const sz         = RANK_SIZES[i];
            const isChampion = i === 0;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.2, y: 60 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  delay:    0.3 + i * 0.18,
                  duration: 0.7,
                  type:     "spring",
                  stiffness: 260,
                  damping:  18,
                }}
                className="flex flex-col items-center gap-3"
              >
                {/* Medal / rank */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.18, type: "spring", stiffness: 400, damping: 20 }}
                  className="text-2xl md:text-3xl"
                  style={{ lineHeight: 1 }}
                >
                  {RANK_MEDALS[i]}
                </motion.div>

                {/* Avatar */}
                <div
                  className="relative rounded-full flex items-center justify-center font-bold flex-shrink-0"
                  style={{
                    width:     sz,
                    height:    sz,
                    background: bg,
                    color:      fg,
                    fontSize:   Math.round(sz * 0.38),
                    border:     isChampion
                      ? `4px solid ${t.gold}`
                      : i < 3
                      ? `3px solid rgba(255,255,255,0.25)`
                      : `2px solid rgba(255,255,255,0.12)`,
                    animation: isChampion ? "celebPulse 2.2s 1.2s ease-in-out infinite" : undefined,
                    boxShadow: isChampion
                      ? `0 0 40px rgba(201,162,74,0.6), 0 8px 24px rgba(0,0,0,0.4)`
                      : i < 3
                      ? `0 6px 20px rgba(0,0,0,0.35)`
                      : `0 4px 12px rgba(0,0,0,0.25)`,
                  }}
                >
                  {label.charAt(0).toUpperCase()}

                  {/* ✓ badge */}
                  <motion.div
                    initial={{ scale: 0, rotate: -60 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.75 + i * 0.18, type: "spring", stiffness: 500, damping: 20 }}
                    className="absolute -bottom-1 -right-1 rounded-full flex items-center justify-center font-bold"
                    style={{
                      width: Math.round(sz * 0.28), height: Math.round(sz * 0.28),
                      fontSize: Math.round(sz * 0.15),
                      background: "#4ec378",
                      border: "2px solid rgba(0,0,0,0.2)",
                      color: "#fff",
                    }}
                  >✓</motion.div>
                </div>

                {/* Name */}
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.62 + i * 0.18 }}
                  className="text-center font-semibold leading-tight"
                  style={{
                    color:    t.text,
                    fontSize: isChampion ? "clamp(0.85rem,1.8vw,1.1rem)" : "clamp(0.72rem,1.5vw,0.95rem)",
                    maxWidth: sz + 20,
                  }}
                >
                  {label.length > 14 ? `${label.slice(0, 13)}…` : label}
                </motion.p>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-8 flex flex-col items-center gap-3"
        >
          <span className="text-5xl">🤔</span>
          <p className="font-display text-2xl md:text-3xl" style={{ color: t.sub }}>
            No correct answers this round
          </p>
        </motion.div>
      )}

      {/* Summary counts */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85 }}
        className="flex items-center gap-3 md:gap-6"
      >
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl"
          style={{ background: `${t.surface}`, border: `1px solid ${t.border}` }}>
          <span className="text-3xl md:text-4xl font-bold tabular-nums" style={{ color: t.sub }}>{totalVotes}</span>
          <span className="text-sm md:text-base font-semibold" style={{ color: t.sub, opacity: 0.65 }}>played</span>
        </div>
        <div className="w-2 h-2 rounded-full" style={{ background: t.border, opacity: 0.4 }} />
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl"
          style={{ background: "rgba(78,195,120,0.15)", border: "1px solid rgba(78,195,120,0.32)" }}>
          <span className="text-3xl md:text-4xl font-bold tabular-nums" style={{ color: "#4ec378" }}>{correct}</span>
          <span className="text-sm md:text-base font-semibold" style={{ color: "#4ec378", opacity: 0.88 }}>correct</span>
        </div>
        <div className="w-2 h-2 rounded-full" style={{ background: t.border, opacity: 0.4 }} />
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl"
          style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.26)" }}>
          <span className="text-3xl md:text-4xl font-bold tabular-nums" style={{ color: "#f87171" }}>{wrong}</span>
          <span className="text-sm md:text-base font-semibold" style={{ color: "#f87171", opacity: 0.88 }}>wrong</span>
        </div>
      </motion.div>
    </div>
  );
}

function CommunityScene({ attendees, t }: {
  attendees: Array<{ id: string; first_name: string; last_name: string }>;
  t: typeof THEMES[ThemeKey];
}) {
  const count = attendees.length;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <style>{`
        @keyframes bubblePop {
          0%   { opacity: 0; transform: scale(0.7) translateY(6px); }
          12%  { opacity: 1; transform: scale(1.05) translateY(-2px); }
          20%  { transform: scale(1) translateY(0); }
          75%  { opacity: 1; }
          100% { opacity: 0; transform: scale(0.9) translateY(-4px); }
        }
      `}</style>

      {/* Floating avatar cloud */}
      {count > 0 && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          {attendees.map((a, i) => {
            const { cx, cy, size, floatDur, floatDel } = avatarPos(i, count);
            const [bg, fg] = avatarColor(a.first_name + a.last_name);
            const showBubble = true; // every avatar gets an animated name bubble (staggered by delay)
            // Bubble appears to the right for avatars in left half, left for right half
            const bubbleRight = cx < 50;
            return (
              <div
                key={a.id}
                className="absolute"
                style={{
                  left:      `${cx}%`,
                  top:       `${cy}%`,
                  transform: "translate(-50%, -50%)",
                  animation: `galleryFloat ${floatDur}s ${floatDel}s ease-in-out infinite`,
                }}
              >
                {/* Avatar circle */}
                <div
                  className="flex items-center justify-center rounded-full font-semibold"
                  style={{
                    width:      `${size}px`,
                    height:     `${size}px`,
                    background: bg,
                    color:      fg,
                    fontSize:   `${size * 0.35}px`,
                    opacity:    0.6 + (i % 4) * 0.1,
                    boxShadow:  `0 4px 16px rgba(0,0,0,0.25)`,
                    border:     `2px solid rgba(255,255,255,0.10)`,
                  }}
                >
                  {initials(a.first_name, a.last_name)}
                </div>

                {/* Speech bubble — appears periodically for select avatars */}
                {showBubble && (
                  <div
                    style={{
                      position:    "absolute",
                      top:         "50%",
                      [bubbleRight ? "left" : "right"]: `${size + 6}px`,
                      transform:   "translateY(-50%)",
                      background:  "rgba(255,255,255,0.12)",
                      backdropFilter: "blur(8px)",
                      border:      `1px solid rgba(255,255,255,0.18)`,
                      borderRadius: "20px",
                      padding:     "5px 11px",
                      whiteSpace:  "nowrap",
                      fontSize:    "12px",
                      fontFamily:  "var(--font-sans, sans-serif)",
                      color:       "rgba(247,242,232,0.9)",
                      animation:   `bubblePop ${bubbleDur(i)}s ${bubbleDelay(i)}s ease-in-out infinite`,
                      pointerEvents: "none",
                    }}
                  >
                    {a.first_name} is here ✦
                    {/* Tail */}
                    <span style={{
                      position:   "absolute",
                      top:        "50%",
                      [bubbleRight ? "left" : "right"]: "-5px",
                      transform:  "translateY(-50%)",
                      width:      0,
                      height:     0,
                      borderTop:  "5px solid transparent",
                      borderBottom: "5px solid transparent",
                      [bubbleRight ? "borderRight" : "borderLeft"]: "6px solid rgba(255,255,255,0.12)",
                      display:    "block",
                    }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Centred count */}
      <div className="relative text-center z-10">
        <p className="text-xl md:text-2xl uppercase tracking-[0.45em] mb-4 font-semibold" style={{ color: t.goldSub }}>In the room</p>
        {count > 0 ? (
          <>
            <p className="font-display text-8xl md:text-[10rem] font-bold leading-none" style={{ color: t.text }}>{count}</p>
            <p className="mt-4 text-2xl md:text-3xl" style={{ color: t.sub }}>people gathered here</p>
          </>
        ) : (
          <p className="font-display text-4xl" style={{ color: t.sub }}>—</p>
        )}
      </div>
    </div>
  );
}
