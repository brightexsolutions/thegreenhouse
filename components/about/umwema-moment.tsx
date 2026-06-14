"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Volume2, VolumeX, Music } from "lucide-react";
import { SESSION_01_UMWEMA_VIDEO } from "@/lib/constants";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EQ_DELAYS = [0, 0.18, 0.09, 0.27, 0.14];

function EqBar({ delay }: { delay: number }) {
  return (
    <motion.span
      className="inline-block w-[2px] bg-gold rounded-full"
      style={{ height: 14, transformOrigin: "bottom" }}
      animate={{ scaleY: [0.25, 1, 0.45, 0.8, 0.25] }}
      transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

export function UmwemaMoment() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef   = useRef<HTMLVideoElement>(null);
  const inView     = useInView(sectionRef, { once: true, margin: "-80px" });
  const [muted,   setMuted]   = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!inView || !videoRef.current) return;
    videoRef.current.play().then(() => setPlaying(true)).catch(() => {});
  }, [inView]);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    if (videoRef.current) videoRef.current.muted = next;
  }

  return (
    <section ref={sectionRef} className="py-20 md:py-28 bg-cream overflow-hidden relative">
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #1b3a2a 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="flex items-center gap-4 mb-14"
        >
          <span className="label-caps text-gold">Hear it for yourself</span>
          <span className="flex-1 h-px bg-gradient-to-r from-gold/35 to-transparent" />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          {/* Left — polaroid video card */}
          <motion.div
            initial={{ opacity: 0, rotate: -3, y: 28 }}
            animate={inView ? { opacity: 1, rotate: -1.5, y: 0 } : {}}
            transition={{ duration: 0.85, delay: 0.1, ease: EASE }}
            className="relative"
          >
            {/* Tape strip */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-gold/20 rounded-[2px] rotate-1 z-10" />

            {/* Polaroid card */}
            <div className="bg-white p-3 pb-10 shadow-2xl shadow-forest/15 rounded-[2px]">
              <div className="relative aspect-video overflow-hidden bg-forest-dark rounded-[1px]">
                <video
                  ref={videoRef}
                  src={SESSION_01_UMWEMA_VIDEO}
                  className="w-full h-full object-cover"
                  muted={muted}
                  loop
                  playsInline
                />
                {/* Mute toggle */}
                <button
                  onClick={toggleMute}
                  aria-label={muted ? "Unmute" : "Mute"}
                  className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>
              </div>

              {/* Caption strip */}
              <div className="pt-3.5 pb-1 px-1 flex items-center justify-between">
                <span className="font-display text-sm text-charcoal/45 italic tracking-wide">
                  Session 01 · March 2025
                </span>
                <span className="label-caps text-gold/55 text-[10px]">Nairobi</span>
              </div>
            </div>

            {/* Offset shadow card */}
            <div className="absolute -bottom-3 -right-3 w-full h-full bg-forest/5 rounded-[2px] border border-forest/8 -z-10" />
          </motion.div>

          {/* Right — song info */}
          <div className="flex flex-col gap-5">
            {/* Now playing pill */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/25 w-fit"
            >
              <Music size={11} className="text-gold" />
              <span className="label-caps text-gold text-[10px]">Now playing · Session 01</span>
              {playing && (
                <span className="flex items-end gap-[2px] h-[14px] ml-0.5">
                  {EQ_DELAYS.map((d, i) => <EqBar key={i} delay={d} />)}
                </span>
              )}
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.75, delay: 0.25, ease: EASE }}
            >
              <h2 className="font-display text-7xl sm:text-8xl font-semibold text-forest leading-none tracking-tight">
                Umwema
              </h2>
              <p className="font-display text-2xl text-gold italic mt-2">
                &ldquo;He is good&rdquo;
              </p>
            </motion.div>

            {/* Gold rule */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ duration: 0.55, delay: 0.42 }}
              className="w-10 h-0.5 bg-gold origin-left"
            />

            {/* Body */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.48 }}
              className="text-charcoal/60 text-base leading-relaxed max-w-sm"
            >
              Sung live at Session 01 — this is the sound of what happens when
              tired souls find a room with no pressure and a lot of grace.
              Unscripted. Unperformed. Real.
            </motion.p>

            {/* Attribution */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.58 }}
              className="flex items-center gap-3 pt-1"
            >
              <div className="w-8 h-8 rounded-full bg-gold/15 border border-gold/25 flex items-center justify-center shrink-0">
                <span className="text-sm">🎵</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-forest">Worship Team · Session 01</p>
                <p className="text-xs text-charcoal/40 mt-0.5">March 28, 2025 · Nairobi, Kenya</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
