"use client";

import { useState, useRef } from "react";
import { Play, Music2 } from "lucide-react";
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
      .replace("/video/upload/", "/video/upload/so_2,w_960,q_auto,f_jpg/")
      .replace(/\.mp4$/, ".jpg")
      .replace(/\.mov$/, ".jpg");
  }
  return null;
}

/** Animated L-shaped corner brackets */
function CornerBrackets() {
  const base = "absolute w-6 h-6 pointer-events-none z-20";
  const color = "border-gold/60";
  const delay = [0.2, 0.28, 0.36, 0.44];
  const corners = [
    `${base} top-0 left-0 border-t-[1.5px] border-l-[1.5px] ${color}`,
    `${base} top-0 right-0 border-t-[1.5px] border-r-[1.5px] ${color}`,
    `${base} bottom-0 left-0 border-b-[1.5px] border-l-[1.5px] ${color}`,
    `${base} bottom-0 right-0 border-b-[1.5px] border-r-[1.5px] ${color}`,
  ];
  return (
    <>
      {corners.map((cls, i) => (
        <motion.span
          key={i}
          className={cls}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay[i], duration: 0.35, ease: "easeOut" }}
        />
      ))}
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
    <div className="relative">
      {/* Label */}
      <div className="flex items-center gap-3 mb-4">
        <span className="h-px w-6 bg-gradient-to-r from-transparent to-gold/45" />
        <span className="text-[10px] uppercase tracking-[0.22em] text-charcoal/45 font-semibold">
          {label}
        </span>
        <span className="h-px flex-1 bg-gradient-to-r from-gold/20 to-transparent" />
      </div>

      {/* Frame + side decorations */}
      <div className="relative">
        {/* Large music icon — left */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
          className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-10 pointer-events-none select-none text-gold/20"
        >
          <Music2 size={72} strokeWidth={1} />
        </motion.div>

        {/* Large music icon — right (mirrored) */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.55, duration: 0.5, ease: "easeOut" }}
          className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-10 pointer-events-none select-none text-gold/20 scale-x-[-1]"
        >
          <Music2 size={72} strokeWidth={1} />
        </motion.div>

        {/* Corner bracket wrapper — p so brackets sit outside the video edge */}
        <div className="relative p-[5px]">
          <CornerBrackets />

          {/* Video frame — full width, no dark bg */}
          <div className="relative rounded-2xl overflow-hidden aspect-video bg-charcoal shadow-xl ring-1 ring-charcoal/10">
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
                  <img
                    src={poster}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 w-full h-full object-cover opacity-70"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1b3a2a] to-[#050a06]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                <button
                  onClick={() => setPlaying(true)}
                  className="absolute inset-0 flex items-center justify-center group"
                  aria-label="Play highlight video"
                >
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gold/85 group-hover:bg-gold group-hover:scale-110 transition-all duration-300 flex items-center justify-center shadow-2xl shadow-black/50">
                    <span
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{ backgroundColor: "rgba(201,162,74,0.35)", animation: "play-pulse 2.4s ease-out infinite" }}
                    />
                    <span
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{ backgroundColor: "rgba(201,162,74,0.20)", animation: "play-pulse 2.4s 0.65s ease-out infinite" }}
                    />
                    <Play size={20} className="text-forest ml-1 relative z-10 sm:hidden" fill="currentColor" />
                    <Play size={24} className="text-forest ml-1 relative z-10 hidden sm:block" fill="currentColor" />
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

          {/* Film-strip label strip */}
          <div className="flex items-center justify-between mt-2.5 px-1">
            <div className="flex items-center gap-2">
              <span className="flex gap-[3px]">
                {[0, 1, 2].map(n => (
                  <span key={n} className="w-[3px] h-[3px] rounded-full bg-charcoal/15" />
                ))}
              </span>
              {eventTitle && (
                <span className="text-[9px] uppercase tracking-[0.16em] text-charcoal/30 font-medium leading-none truncate max-w-[180px]">
                  {eventTitle}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {eventDate && (
                <span className="text-[9px] text-charcoal/25 tabular-nums">{eventDate}</span>
              )}
              <span className="flex gap-[3px]">
                {[0, 1, 2].map(n => (
                  <span key={n} className="w-[3px] h-[3px] rounded-full bg-charcoal/15" />
                ))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
