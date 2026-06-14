"use client";

import { useState, useRef, useEffect } from "react";
import { Play, X, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { SESSION_01_HIGHLIGHT_VIDEO, SESSION_01_UMWEMA_VIDEO } from "@/lib/constants";

const VIDEOS = [
  {
    id:          "ewe-yesu",
    title:       "Ewe Yesu Wangu",
    translation: null,
    label:       "Session 01 · 2026",
    duration:    "5:07",
    src:         SESSION_01_HIGHLIGHT_VIDEO,
    thumb:       "https://res.cloudinary.com/dpjget2he/video/upload/so_2/v1781371203/greenhouse-session-1-ewe-yesu_g3yorq.jpg",
  },
  {
    id:          "umwema",
    title:       "Umwema",
    translation: "He is good",
    label:       "Session 01 · 2026",
    duration:    "6:04",
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
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10 bg-black/92 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl aspect-video ring-1 ring-white/5">
          <video
            ref={videoRef}
            src={video.src}
            autoPlay
            controls
            playsInline
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex items-center justify-between mt-4 px-1">
          <div>
            <p className="text-cream font-display font-medium text-xl leading-tight">
              {video.title}
              {video.translation && (
                <span className="text-gold/60 italic text-base ml-2">— &ldquo;{video.translation}&rdquo;</span>
              )}
            </p>
            <p className="text-cream/35 text-xs mt-1">{video.label}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-cream/50 hover:text-cream transition-all"
            >
              {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-cream/50 hover:text-cream transition-all"
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
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });

  return (
    <>
      {/* Dark cinema panel */}
      <motion.div
        ref={sectionRef}
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl overflow-hidden mb-14 bg-[#090f0b]"
      >
        {/* Gold spotlight — breathes */}
        <motion.div
          aria-hidden
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[620px] h-[340px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(201,162,74,0.24) 0%, transparent 65%)" }}
        />
        {/* Second gold layer — wider, softer fill */}
        <div
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[220px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(201,162,74,0.09) 0%, transparent 75%)" }}
        />
        {/* Forest glow — bottom right, breathes on offset timer */}
        <motion.div
          aria-hidden
          animate={{ opacity: [0.65, 1, 0.65] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-0 right-0 w-[400px] h-[240px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 100% 100%, rgba(27,58,42,0.80) 0%, transparent 65%)" }}
        />
        {/* Occasional light-leak sweep */}
        <motion.div
          aria-hidden
          animate={{ x: ["-60%", "200%"], opacity: [0, 0.45, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 9, ease: "easeInOut" }}
          className="absolute top-[38%] h-px w-[40%] pointer-events-none"
          style={{ background: "linear-gradient(to right, transparent, rgba(201,162,74,0.55), transparent)" }}
        />
        {/* Top border — scales in */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent origin-center"
        />

        <div className="relative px-6 sm:px-10 py-10 sm:py-12">

          {/* Section label */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center justify-center gap-3 mb-9"
          >
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold/55" />
            <span className="text-[10px] uppercase tracking-[0.22em] text-gold/70 font-semibold">Session Recordings</span>
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-gold/55" />
          </motion.div>

          {/* Video cards */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            {VIDEOS.map((v, i) => (
              <motion.button
                key={v.id}
                onClick={() => setActive(v)}
                initial={{ opacity: 0, y: 28 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.38 + i * 0.16, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4 }}
                className="group relative w-full sm:w-[272px] rounded-2xl overflow-hidden text-left
                           border border-white/[0.055] hover:border-gold/28
                           shadow-xl shadow-black/50 hover:shadow-[0_12px_44px_rgba(201,162,74,0.18)]
                           transition-[border-color,box-shadow] duration-400
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                aria-label={`Play ${v.title}`}
              >
                {/* Thumbnail */}
                <div className="aspect-video relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1b3a2a] to-[#050a06]" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.thumb}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover
                               opacity-55 group-hover:opacity-78
                               scale-100 group-hover:scale-[1.05]
                               transition-all duration-500 ease-out"
                    aria-hidden
                  />
                  {/* Cinematic gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090f0b]/95 via-[#090f0b]/15 to-transparent" />
                  <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#090f0b]/50 to-transparent" />

                  {/* Play button — idle pulse rings */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-10 h-10 rounded-full bg-gold/80 group-hover:bg-gold group-hover:scale-110 transition-all duration-300 flex items-center justify-center shadow-lg shadow-black/50">
                      <motion.span
                        animate={{ scale: [1, 1.75], opacity: [0.35, 0] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full bg-gold/40 pointer-events-none"
                      />
                      <motion.span
                        animate={{ scale: [1, 1.5], opacity: [0.2, 0] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
                        className="absolute inset-0 rounded-full bg-gold/30 pointer-events-none"
                      />
                      <Play size={13} className="text-forest ml-[2px] relative z-10" fill="currentColor" />
                    </div>
                  </div>

                  {v.duration && (
                    <span className="absolute bottom-2 right-2 px-1.5 py-[2px] rounded bg-black/55 text-cream/60 text-[9px] font-medium tabular-nums backdrop-blur-sm">
                      {v.duration}
                    </span>
                  )}
                </div>

                {/* Card footer */}
                <div className="px-3.5 py-3.5 bg-[#0d1a12]/80 backdrop-blur-sm border-t border-white/[0.04]">
                  <p className="font-display font-medium text-cream/90 text-[15px] leading-tight">
                    {v.title}
                  </p>
                  {v.translation && (
                    <p className="text-gold/50 italic text-[11px] mt-0.5">&ldquo;{v.translation}&rdquo;</p>
                  )}
                  <p className="text-cream/35 text-[10px] mt-2 tracking-wide">{v.label}</p>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Bottom note — visible */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.75 }}
            className="text-center text-cream/45 text-[10px] tracking-[0.2em] mt-8 uppercase"
          >
            More recordings after each session
          </motion.p>
        </div>
      </motion.div>

      {/* Photo grid divider */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-[10px] uppercase tracking-[0.18em] text-charcoal/35 font-medium">Photos</span>
        <span className="flex-1 h-px bg-gradient-to-r from-charcoal/12 to-transparent" />
      </div>

      <AnimatePresence>
        {active && <VideoModal video={active} onClose={() => setActive(null)} />}
      </AnimatePresence>
    </>
  );
}
