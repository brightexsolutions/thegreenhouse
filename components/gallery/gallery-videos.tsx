"use client";

import { useState, useRef, useEffect } from "react";
import { Play, X, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SESSION_01_HIGHLIGHT_VIDEO, SESSION_01_UMWEMA_VIDEO } from "@/lib/constants";

const VIDEOS = [
  {
    id:          "ewe-yesu",
    title:       "Ewe Yesu Wangu",
    translation: null,
    label:       "Session 01 · 2026",
    duration:    "5:07",
    src:         SESSION_01_HIGHLIGHT_VIDEO,
    // Cloudinary auto-generates a poster frame at the same URL with .jpg
    thumb:       "https://res.cloudinary.com/dpjget2he/video/upload/so_2/v1781371203/greenhouse-session-1-ewe-yesu_g3yorq.jpg",
  },
  {
    id:          "umwema",
    title:       "Umwema",
    translation: "He is good",
    label:       "Session 01 · 2026",
    duration:    null,
    src:         SESSION_01_UMWEMA_VIDEO,
    thumb:       "https://res.cloudinary.com/dpjget2he/video/upload/so_2/v1781426590/greenhouse-session-1-umwema_znsmuo.jpg",
  },
];

function VideoModal({ video, onClose }: { video: typeof VIDEOS[0]; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  function toggleMute() {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video */}
        <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl aspect-video">
          <video
            ref={videoRef}
            src={video.src}
            autoPlay
            controls
            playsInline
            className="w-full h-full object-contain"
          />
        </div>

        {/* Title bar */}
        <div className="flex items-center justify-between mt-3 px-1">
          <div>
            <p className="text-cream font-display font-medium text-lg leading-tight">
              {video.title}
              {video.translation && (
                <span className="text-gold/70 italic text-base ml-2">— &ldquo;{video.translation}&rdquo;</span>
              )}
            </p>
            <p className="text-cream/40 text-xs mt-0.5">{video.label}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-cream/70 hover:text-cream transition-all"
            >
              {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-cream/70 hover:text-cream transition-all"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function GalleryVideos() {
  const [active, setActive] = useState<typeof VIDEOS[0] | null>(null);

  return (
    <>
      {/* Section divider + label */}
      <div className="flex items-center gap-4 mb-6">
        <span className="label-caps text-gold text-xs tracking-widest">Session Recordings</span>
        <span className="flex-1 h-px bg-gradient-to-r from-gold/30 to-transparent" />
      </div>

      {/* Video cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-12">
        {VIDEOS.map((v) => (
          <button
            key={v.id}
            onClick={() => setActive(v)}
            className="group relative rounded-2xl overflow-hidden bg-forest-dark text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            aria-label={`Play ${v.title}`}
          >
            {/* Thumbnail */}
            <div className="aspect-video relative">
              {/* Fallback gradient bg (shown if thumbnail fails) */}
              <div className="absolute inset-0 bg-gradient-to-br from-forest to-[#070c09]" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={v.thumb}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-opacity duration-300"
                aria-hidden
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gold/90 group-hover:bg-gold group-hover:scale-110 transition-all duration-300 flex items-center justify-center shadow-lg shadow-black/40">
                  <Play size={18} className="text-forest ml-0.5" fill="currentColor" />
                </div>
              </div>

              {/* Duration badge */}
              {v.duration && (
                <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/60 text-cream/80 text-[10px] font-medium tabular-nums backdrop-blur-sm">
                  {v.duration}
                </span>
              )}
            </div>

            {/* Card footer */}
            <div className="px-3 py-3">
              <p className="font-display font-medium text-cream text-sm sm:text-base leading-tight">
                {v.title}
              </p>
              {v.translation && (
                <p className="text-gold/60 italic text-xs mt-0.5">&ldquo;{v.translation}&rdquo;</p>
              )}
              <p className="text-cream/35 text-[11px] mt-1">{v.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Photo grid divider */}
      <div className="flex items-center gap-4 mb-6">
        <span className="label-caps text-charcoal/40 text-xs tracking-widest">Photos</span>
        <span className="flex-1 h-px bg-gradient-to-r from-charcoal/15 to-transparent" />
      </div>

      {/* Modal */}
      <AnimatePresence>
        {active && <VideoModal video={active} onClose={() => setActive(null)} />}
      </AnimatePresence>
    </>
  );
}
