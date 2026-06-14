"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Volume2, VolumeX, ArrowUpRight, Play, Pause } from "lucide-react";
import { SESSION_01_HIGHLIGHT_VIDEO } from "@/lib/constants";

const CORNERS = [
  { key: "tl", cls: "-top-3 -left-3 border-t-2 border-l-2 rounded-tl-2xl" },
  { key: "tr", cls: "-top-3 -right-3 border-t-2 border-r-2 rounded-tr-2xl" },
  { key: "bl", cls: "-bottom-3 -left-3 border-b-2 border-l-2 rounded-bl-2xl" },
  { key: "br", cls: "-bottom-3 -right-3 border-b-2 border-r-2 rounded-br-2xl" },
];

const PARTICLES = [
  { size: 2,   left: "12%",  delay: 0,    duration: 6.5, amp: 55 },
  { size: 1.5, left: "28%",  delay: 1.3,  duration: 8.2, amp: 40 },
  { size: 3,   left: "51%",  delay: 0.6,  duration: 7.1, amp: 65 },
  { size: 1,   left: "67%",  delay: 2.1,  duration: 9,   amp: 45 },
  { size: 2,   left: "83%",  delay: 0.4,  duration: 6.8, amp: 50 },
  { size: 1.5, left: "40%",  delay: 1.7,  duration: 7.6, amp: 38 },
  { size: 1,   left: "74%",  delay: 3.0,  duration: 8.5, amp: 60 },
];

const WAVE = [2, 5, 8, 4, 9, 5, 7, 3, 8, 6, 4, 9, 3, 7, 5, 8, 4, 6, 3, 7, 5, 4, 8, 3, 6];

export function SessionHighlight() {
  const sectionRef  = useRef<HTMLDivElement>(null);
  const videoRef    = useRef<HTMLVideoElement>(null);
  const isInView    = useInView(sectionRef, { once: true, margin: "-80px" });
  const isVisible   = useInView(sectionRef, { margin: "-15%" });

  const [muted,    setMuted]    = useState(true);
  const [ready,    setReady]    = useState(false);
  const [paused,   setPaused]   = useState(false);
  const [hovering, setHovering] = useState(false);
  const [progress, setProgress] = useState(0);

  // Play as soon as the browser can start — "canplay" fires much earlier than
  // "canplaythrough" on Safari with large files.
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onReady = () => { setReady(true); vid.play().catch(() => {}); };
    vid.addEventListener("canplay", onReady, { once: true });
    return () => vid.removeEventListener("canplay", onReady);
  }, []);

  // Pause / resume on scroll
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !ready || paused) return;
    if (isVisible) vid.play().catch(() => {});
    else vid.pause();
  }, [isVisible, ready, paused]);

  // Progress bar
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const tick = () => { if (vid.duration) setProgress(vid.currentTime / vid.duration); };
    vid.addEventListener("timeupdate", tick);
    return () => vid.removeEventListener("timeupdate", tick);
  }, []);

  function toggleMute() {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setMuted(vid.muted);
  }

  function togglePlay() {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) { vid.play().catch(() => {}); setPaused(false); }
    else { vid.pause(); setPaused(true); }
  }

  return (
    <section ref={sectionRef} className="relative bg-[#070c09] overflow-hidden py-24 md:py-32">

      {/* Film grain */}
      <div
        className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay opacity-[0.09]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "160px 160px",
        }}
      />

      {/* "01" watermark */}
      <div className="absolute inset-0 flex items-center justify-end overflow-hidden pointer-events-none select-none">
        <motion.span
          initial={{ opacity: 0, x: 80 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1.4, ease: "easeOut" }}
          className="font-display font-bold text-cream/[0.045] leading-none pr-4"
          style={{ fontSize: "clamp(180px, 30vw, 420px)" }}
        >
          01
        </motion.span>
      </div>

      {/* Breathing top-left gold glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 2.5 }}
        className="absolute -top-40 -left-40 w-[750px] h-[750px] rounded-full pointer-events-none"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="w-full h-full rounded-full"
          style={{ background: "radial-gradient(circle, rgba(201,162,74,0.22) 0%, transparent 65%)" }}
        />
      </motion.div>

      {/* Breathing bottom-right forest glow */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute -bottom-32 -right-32 w-[650px] h-[650px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(46,90,62,0.85) 0%, transparent 70%)" }}
      />

      {/* One-shot horizontal light leak on entrance */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={isInView ? { opacity: [0, 0.55, 0], scaleX: [0, 1, 1] } : {}}
        transition={{ duration: 2.8, delay: 1.0, ease: "easeOut" }}
        className="absolute top-[40%] left-0 right-0 h-[2px] pointer-events-none origin-left"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(201,162,74,0.7) 25%, rgba(228,201,126,0.9) 50%, rgba(201,162,74,0.5) 75%, transparent 100%)",
        }}
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #f7f2e8 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Floating gold particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gold"
            style={{ width: p.size * 2, height: p.size * 2, left: p.left, bottom: "8%", opacity: 0 }}
            animate={{ y: [0, -p.amp, -p.amp * 2.2], opacity: [0, 0.75, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
          />
        ))}
      </div>

      {/* ── Content ── */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Overline */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="h-px w-10 bg-gold/50" />
          <span className="label-caps text-gold/65 text-xs tracking-widest">From the last session</span>
          <div className="h-px w-6 bg-gold/20" />
        </motion.div>

        {/* Title row */}
        <div className="flex items-start justify-between gap-8 mb-8">

          <div className="flex-1 overflow-hidden">
            <motion.h2
              initial={{ y: 90, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="font-display font-semibold text-cream leading-[0.92]"
              style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)" }}
            >
              Ewe Yesu
            </motion.h2>

            <div className="relative">
              <motion.h2
                initial={{ y: 90, opacity: 0 }}
                animate={isInView ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                className="font-display font-semibold leading-[0.92] text-gold relative overflow-hidden"
                style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)" }}
              >
                Wangu,
                {/* Shimmer sweep */}
                <motion.span
                  className="absolute inset-0 pointer-events-none"
                  initial={{ x: "-110%" }}
                  animate={isInView ? { x: "210%" } : {}}
                  transition={{ duration: 1.6, delay: 1.4, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
                  style={{
                    background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%)",
                  }}
                />
              </motion.h2>

              {/* Underline */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ duration: 1, ease: "easeOut", delay: 0.75 }}
                style={{ originX: 0 }}
                className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-gold/70 via-gold/30 to-transparent"
              />
            </div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="text-cream/30 text-sm mt-5 tracking-wide"
            >
              Session 01 &nbsp;·&nbsp; 2026 &nbsp;·&nbsp; Nairobi, Kenya
            </motion.p>
          </div>

          {/* Ring cluster — desktop */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1, delay: 0.5 }}
            className="relative w-28 h-28 hidden md:flex items-center justify-center flex-shrink-0 mt-3"
          >
            {/* Slow rotating dashed outer ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-dashed border-gold/30"
            />
            {/* Slow counter-rotate inner dashed */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
              className="absolute inset-3 rounded-full border border-dashed border-gold/20"
            />
            <div className="absolute inset-0 rounded-full border border-gold/25 animate-ping" style={{ animationDuration: "3.8s" }} />
            <div className="absolute inset-2 rounded-full border border-gold/40" />
            <div className="absolute inset-5 rounded-full border border-gold/55" />
            <div className="w-3.5 h-3.5 rounded-full bg-gold/80" />
            <div className="absolute top-1.5 right-3 w-1.5 h-1.5 rounded-full bg-gold/50" />
            <div className="absolute bottom-2 left-1.5 w-1 h-1 rounded-full bg-gold/35" />
          </motion.div>
        </div>

        {/* Decorative animated waveform */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.85 }}
          className="flex items-end gap-[3px] mb-12 h-7"
        >
          {WAVE.map((h, i) => (
            <motion.div
              key={i}
              className="w-[3px] rounded-full bg-gold/50"
              style={{ height: `${h * 11}%` }}
              animate={{ scaleY: [0.6, 1, 0.6], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.8 + (i % 5) * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.06 }}
            />
          ))}
        </motion.div>

        {/* ── Video ── */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.32 }}
          className="relative"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          {/* Ambient cinema blur */}
          <motion.div
            animate={{ opacity: hovering ? 1 : 0.75, scale: hovering ? 1.05 : 1 }}
            transition={{ duration: 0.8 }}
            className="absolute -inset-6 rounded-3xl pointer-events-none blur-3xl"
            style={{
              background: "radial-gradient(ellipse at 25% 65%, rgba(201,162,74,0.55) 0%, transparent 50%), radial-gradient(ellipse at 75% 25%, rgba(180,80,40,0.40) 0%, transparent 50%), radial-gradient(ellipse at 55% 85%, rgba(100,60,20,0.30) 0%, transparent 45%)",
            }}
          />

          {/* Gradient glow border */}
          <div
            className="p-[1.5px] rounded-2xl transition-all duration-700"
            style={{
              background: hovering
                ? "linear-gradient(135deg, rgba(201,162,74,0.85) 0%, rgba(201,162,74,0.25) 35%, rgba(228,201,126,0.15) 60%, rgba(201,162,74,0.55) 100%)"
                : "linear-gradient(135deg, rgba(201,162,74,0.50) 0%, rgba(201,162,74,0.10) 45%, transparent 65%, rgba(201,162,74,0.25) 100%)",
            }}
          >
            {/* Gold corner accents */}
            {CORNERS.map(({ key, cls }, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.7 + i * 0.07 }}
                className={`absolute z-10 w-8 h-8 pointer-events-none border-gold/80 ${cls}`}
              />
            ))}

            {/* Video */}
            <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl">
              <video
                ref={videoRef}
                src={SESSION_01_HIGHLIGHT_VIDEO}
                muted
                loop
                playsInline
                preload="auto"
                className="w-full aspect-video object-cover"
              />

              {/* Cinematic vignette */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.52) 100%)" }}
              />

              {/* Subtle scanlines */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.025]"
                style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,1) 2px, rgba(0,0,0,1) 4px)" }}
              />

              {/* Bottom gradient for controls */}
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/8">
                <div
                  className="h-full bg-gradient-to-r from-gold/50 to-gold/80"
                  style={{ width: `${progress * 100}%`, transition: "width 0.5s linear" }}
                />
              </div>

              {/* Controls */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    aria-label={paused ? "Play" : "Pause"}
                    className="w-7 h-7 rounded-full bg-black/55 backdrop-blur-sm border border-cream/10 hover:border-cream/25 flex items-center justify-center text-cream/65 hover:text-cream transition-all"
                  >
                    {paused
                      ? <Play  size={10} className="ml-0.5" />
                      : <Pause size={10} />
                    }
                  </button>
                  <span className="text-cream/40 text-[11px] font-medium tabular-nums">5:07</span>
                </div>

                <button
                  onClick={toggleMute}
                  aria-label={muted ? "Unmute" : "Mute"}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-sm border border-cream/10 hover:border-cream/25 text-cream/65 hover:text-cream text-[11px] font-medium transition-all"
                >
                  {muted ? <VolumeX size={11} /> : <Volume2 size={11} />}
                  {muted ? "Tap to hear" : "Sound on"}
                </button>
              </div>

              {/* Loading spinner */}
              {!ready && (
                <div className="absolute inset-0 bg-[#070c09]/80 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full border-2 border-gold/20 border-t-gold/65 animate-spin" />
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="flex items-center justify-between mt-7"
        >
          <p className="text-cream/20 text-xs">
            {muted ? "Unmute to hear the session" : "Now playing with sound"}
          </p>
          <Link
            href="/events/session-01"
            className="inline-flex items-center gap-1.5 text-xs text-gold/50 hover:text-gold font-medium transition-colors group"
          >
            View full session
            <ArrowUpRight size={11} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
