"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Volume2, VolumeX, ArrowUpRight } from "lucide-react";
import { SESSION_01_HIGHLIGHT_VIDEO } from "@/lib/constants";

const CORNERS = [
  { key: "tl", cls: "-top-3 -left-3 border-t-2 border-l-2 rounded-tl-2xl" },
  { key: "tr", cls: "-top-3 -right-3 border-t-2 border-r-2 rounded-tr-2xl" },
  { key: "bl", cls: "-bottom-3 -left-3 border-b-2 border-l-2 rounded-bl-2xl" },
  { key: "br", cls: "-bottom-3 -right-3 border-b-2 border-r-2 rounded-br-2xl" },
];

export function SessionHighlight() {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView   = useInView(sectionRef, { once: true, margin: "-80px" });

  const [muted,    setMuted]    = useState(true);
  const [ready,    setReady]    = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onReady = () => {
      setReady(true);
      vid.play().catch(() => {});
    };
    vid.addEventListener("canplaythrough", onReady, { once: true });
    return () => vid.removeEventListener("canplaythrough", onReady);
  }, []);

  function toggleMute() {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setMuted(vid.muted);
  }

  return (
    <section ref={sectionRef} className="relative bg-[#070c09] overflow-hidden py-24 md:py-32">

      {/* ── Background decoration ── */}

      {/* Large "01" watermark */}
      <div className="absolute inset-0 flex items-center justify-end overflow-hidden pointer-events-none select-none">
        <motion.span
          initial={{ opacity: 0, x: 80 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 80 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          className="font-display font-bold text-cream/[0.022] leading-none pr-4"
          style={{ fontSize: "clamp(180px, 30vw, 420px)" }}
        >
          01
        </motion.span>
      </div>

      {/* Top-left gold ambient glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 2.5 }}
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(201,162,74,0.06) 0%, transparent 65%)" }}
      />

      {/* Bottom-right forest glow */}
      <div
        className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(27,58,42,0.55) 0%, transparent 70%)" }}
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #f7f2e8 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* ── Main content ── */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-12 md:mb-16">

          {/* Overline */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -24 }}
            transition={{ duration: 0.7 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="h-px w-10 bg-gold/50" />
            <span className="label-caps text-gold/65 text-xs tracking-widest">From the last session</span>
            <div className="h-px w-6 bg-gold/20" />
          </motion.div>

          <div className="flex items-start justify-between gap-8">

            {/* Title block */}
            <div className="flex-1 overflow-hidden">
              <motion.h2
                initial={{ y: 90, opacity: 0 }}
                animate={isInView ? { y: 0, opacity: 1 } : { y: 90, opacity: 0 }}
                transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                className="font-display font-semibold text-cream leading-[0.92]"
                style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)" }}
              >
                Ewe Yesu
              </motion.h2>

              <div className="relative">
                <motion.h2
                  initial={{ y: 90, opacity: 0 }}
                  animate={isInView ? { y: 0, opacity: 1 } : { y: 90, opacity: 0 }}
                  transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                  className="font-display font-semibold leading-[0.92] text-gold"
                  style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)" }}
                >
                  Wangu,
                </motion.h2>
                {/* Animated gold underline */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.75 }}
                  style={{ originX: 0 }}
                  className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-gold/70 via-gold/30 to-transparent"
                />
              </div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="text-cream/30 text-sm mt-5 tracking-wide"
              >
                Session 01 &nbsp;·&nbsp; 2026 &nbsp;·&nbsp; Nairobi, Kenya
              </motion.p>
            </div>

            {/* Pulsing ring cluster — desktop */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="relative w-28 h-28 hidden md:flex items-center justify-center flex-shrink-0 mt-3"
            >
              <div className="absolute inset-0 rounded-full border border-gold/12 animate-ping" style={{ animationDuration: "3.8s" }} />
              <div className="absolute inset-2 rounded-full border border-gold/18" />
              <div className="absolute inset-5 rounded-full border border-gold/28" />
              <div className="w-3.5 h-3.5 rounded-full bg-gold/55" />
              <div className="absolute top-1.5 right-3 w-1.5 h-1.5 rounded-full bg-gold/25" />
              <div className="absolute bottom-2 left-1.5 w-1 h-1 rounded-full bg-gold/18" />
            </motion.div>
          </div>
        </div>

        {/* ── Video block ── */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.32 }}
          className="relative"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          {/* Warm cinema ambient blur — beneath the video */}
          <div
            className={`absolute inset-0 rounded-3xl transition-opacity duration-700 pointer-events-none blur-2xl scale-[0.95] ${
              hovering ? "opacity-70" : "opacity-45"
            }`}
            style={{
              background: "radial-gradient(ellipse at 30% 60%, rgba(201,162,74,0.18) 0%, transparent 55%), radial-gradient(ellipse at 70% 30%, rgba(180,100,60,0.12) 0%, transparent 50%)",
            }}
          />

          {/* Gold corner frame accents */}
          {CORNERS.map(({ key, cls }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.5, delay: 0.7 + i * 0.07 }}
              className={`absolute z-10 w-7 h-7 pointer-events-none border-gold/55 ${cls}`}
            />
          ))}

          {/* Video itself */}
          <div className="relative rounded-2xl overflow-hidden bg-black ring-1 ring-white/5 shadow-2xl">
            <video
              ref={videoRef}
              src={SESSION_01_HIGHLIGHT_VIDEO}
              muted
              loop
              playsInline
              preload="metadata"
              className="w-full aspect-video object-cover"
            />

            {/* Cinematic vignette overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.45) 100%)" }}
            />
            {/* Bottom fade for controls */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/65 to-transparent pointer-events-none" />

            {/* Duration */}
            <div className="absolute bottom-4 left-4 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-sm text-cream/55 text-[11px] font-medium tabular-nums">
              5:07
            </div>

            {/* Mute toggle */}
            <button
              onClick={toggleMute}
              className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-sm border border-cream/10 hover:border-cream/25 text-cream/65 hover:text-cream text-[11px] font-medium transition-all"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX size={11} /> : <Volume2 size={11} />}
              {muted ? "Sound off" : "Sound on"}
            </button>

            {/* Loading spinner */}
            {!ready && (
              <div className="absolute inset-0 bg-[#070c09]/75 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-2 border-gold/20 border-t-gold/60 animate-spin" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Footer row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="flex items-center justify-between mt-7"
        >
          <p className="text-cream/20 text-xs">
            {muted ? `Click "Sound off" to hear the session` : "Playing with sound"}
          </p>
          <Link
            href="/events/session-01"
            className="inline-flex items-center gap-1.5 text-xs text-gold/50 hover:text-gold font-medium transition-colors group"
          >
            View full session
            <ArrowUpRight
              size={11}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
