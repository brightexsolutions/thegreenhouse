"use client";

import { useState, useRef } from "react";
import { Play } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  src?: string;
  youtubeEmbedUrl?: string;
  label?: string;
  eventTitle?: string;
  eventDate?: string;
}

function derivePoster(src: string): string | null {
  if (src.includes("res.cloudinary.com")) {
    return src
      .replace("/video/upload/", "/video/upload/so_2/")
      .replace(/\.mp4$/, ".jpg")
      .replace(/\.mov$/, ".jpg");
  }
  return null;
}

/** Four gold L-shaped corner brackets */
function CornerBrackets() {
  const variants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: { opacity: 1, scale: 1 },
  };
  const base = "absolute w-5 h-5 pointer-events-none z-20";
  const line = "border-gold/55";

  return (
    <>
      <motion.span variants={variants} initial="hidden" animate="visible"
        transition={{ delay: 0.25, duration: 0.35, ease: "easeOut" }}
        className={`${base} top-0 left-0 border-t-[1.5px] border-l-[1.5px] ${line}`}
      />
      <motion.span variants={variants} initial="hidden" animate="visible"
        transition={{ delay: 0.32, duration: 0.35, ease: "easeOut" }}
        className={`${base} top-0 right-0 border-t-[1.5px] border-r-[1.5px] ${line}`}
      />
      <motion.span variants={variants} initial="hidden" animate="visible"
        transition={{ delay: 0.39, duration: 0.35, ease: "easeOut" }}
        className={`${base} bottom-0 left-0 border-b-[1.5px] border-l-[1.5px] ${line}`}
      />
      <motion.span variants={variants} initial="hidden" animate="visible"
        transition={{ delay: 0.46, duration: 0.35, ease: "easeOut" }}
        className={`${base} bottom-0 right-0 border-b-[1.5px] border-r-[1.5px] ${line}`}
      />
    </>
  );
}

export function EventHighlightVideo({
  src,
  youtubeEmbedUrl,
  label = "Session Highlight",
  eventTitle,
  eventDate,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const poster = src ? derivePoster(src) : null;

  return (
    <div className="relative rounded-3xl overflow-hidden bg-[#090f0b]">
      {/* Gold spotlight — breathes */}
      <motion.div
        aria-hidden
        animate={{ opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[260px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(201,162,74,0.20) 0%, transparent 65%)" }}
      />
      {/* Forest glow — bottom right */}
      <motion.div
        aria-hidden
        animate={{ opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-0 right-0 w-[340px] h-[200px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 100% 100%, rgba(27,58,42,0.75) 0%, transparent 65%)" }}
      />
      {/* Occasional light-leak */}
      <motion.div
        aria-hidden
        animate={{ x: ["-60%", "200%"], opacity: [0, 0.38, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 10, ease: "easeInOut" }}
        className="absolute top-[35%] h-px w-1/3 pointer-events-none"
        style={{ background: "linear-gradient(to right, transparent, rgba(201,162,74,0.48), transparent)" }}
      />
      {/* Top border */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent" />

      {/* Label row */}
      <div className="relative px-5 sm:px-6 pt-5 pb-3 flex items-center gap-3">
        <span className="h-px w-6 bg-gradient-to-r from-transparent to-gold/50" />
        <span className="text-[10px] uppercase tracking-[0.22em] text-gold/65 font-semibold">{label}</span>
        <span className="h-px flex-1 bg-gradient-to-r from-gold/25 to-transparent" />
      </div>

      {/* Video frame */}
      <div className="relative px-5 sm:px-7 pb-5 sm:pb-6">
        {/* Corner bracket wrapper — overflow visible so brackets sit outside the video */}
        <div className="relative p-[6px]">
          <CornerBrackets />

          {/* Actual video container */}
          <div className="relative rounded-xl overflow-hidden aspect-video bg-black ring-1 ring-white/[0.06]">
            {youtubeEmbedUrl ? (
              <iframe
                src={youtubeEmbedUrl}
                title={label}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            ) : src && !playing ? (
              <>
                {poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={poster} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-65" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1b3a2a] to-[#050a06]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                <button
                  onClick={() => setPlaying(true)}
                  className="absolute inset-0 flex items-center justify-center group"
                  aria-label="Play highlight video"
                >
                  <div className="relative w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-gold/85 group-hover:bg-gold group-hover:scale-110 transition-all duration-300 flex items-center justify-center shadow-2xl shadow-black/60">
                    <motion.span
                      animate={{ scale: [1, 1.8], opacity: [0.32, 0] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
                      className="absolute inset-0 rounded-full bg-gold/35 pointer-events-none"
                    />
                    <motion.span
                      animate={{ scale: [1, 1.55], opacity: [0.18, 0] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 0.65 }}
                      className="absolute inset-0 rounded-full bg-gold/25 pointer-events-none"
                    />
                    <Play size={20} className="text-forest ml-1 relative z-10" fill="currentColor" />
                  </div>
                </button>
              </>
            ) : src ? (
              <video
                ref={videoRef}
                src={src}
                autoPlay
                playsInline
                controls
                loop
                className="absolute inset-0 w-full h-full object-contain"
              />
            ) : null}
          </div>

          {/* Film-strip info strip below the frame */}
          <div className="flex items-center justify-between mt-3 px-1">
            <div className="flex items-center gap-2">
              {/* Sprocket holes */}
              <span className="flex gap-1">
                {[0,1,2].map(n => (
                  <span key={n} className="w-1 h-1 rounded-full bg-cream/12" />
                ))}
              </span>
              {eventTitle && (
                <span className="text-[9px] uppercase tracking-[0.18em] text-cream/30 font-medium leading-none truncate max-w-[160px]">
                  {eventTitle}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {eventDate && (
                <span className="text-[9px] text-cream/20 tabular-nums">{eventDate}</span>
              )}
              <span className="flex gap-1">
                {[0,1,2].map(n => (
                  <span key={n} className="w-1 h-1 rounded-full bg-cream/12" />
                ))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
