"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";

export interface GalleryImage {
  id:      string;
  src:     string;
  fullSrc: string;
  alt:     string;
}

interface Props {
  images:     GalleryImage[];
  eventTitle: string;
}

export function GalleryCarousel({ images, eventTitle }: Props) {
  const scrollRef    = useRef<HTMLDivElement>(null);
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const pausedRef    = useRef(false);
  const [activeIdx,   setActiveIdx]   = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const isInView = useInView(wrapperRef, { once: true, margin: "-80px" });

  const scrollNext = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector("button") as HTMLElement | null;
    if (!card) return;
    const step  = card.offsetWidth + 12;
    const maxSc = el.scrollWidth - el.clientWidth;
    if (el.scrollLeft >= maxSc - 4) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      el.scrollBy({ left: step, behavior: "smooth" });
    }
  }, []);

  // Auto-scroll every 3.5s
  useEffect(() => {
    if (images.length <= 3) return;
    const id = setInterval(() => {
      if (!pausedRef.current) scrollNext();
    }, 3500);
    return () => clearInterval(id);
  }, [images.length, scrollNext]);

  // Track active card for dot indicators
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const card = el.querySelector("button") as HTMLElement | null;
      if (!card) return;
      setActiveIdx(Math.round(el.scrollLeft / (card.offsetWidth + 12)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Keyboard nav for lightbox
  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")     setLightboxIdx(null);
      if (e.key === "ArrowRight") setLightboxIdx(i => i !== null ? (i + 1) % images.length : null);
      if (e.key === "ArrowLeft")  setLightboxIdx(i => i !== null ? (i - 1 + images.length) % images.length : null);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [lightboxIdx, images.length]);

  useEffect(() => {
    document.body.style.overflow = lightboxIdx !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightboxIdx]);

  if (!images.length) return null;

  return (
    <>
      <div ref={wrapperRef} className="relative">
        {/* Right-edge fade — suggests more to scroll */}
        <div
          aria-hidden
          className="absolute right-0 top-0 bottom-1 w-20 bg-gradient-to-l from-charcoal to-transparent z-10 pointer-events-none"
        />
        {/* Left-edge fade */}
        <div
          aria-hidden
          className="absolute left-0 top-0 bottom-1 w-10 bg-gradient-to-r from-charcoal/70 to-transparent z-10 pointer-events-none"
        />

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1"
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
          onTouchStart={() => { pausedRef.current = true; }}
          onTouchEnd={() => { setTimeout(() => { pausedRef.current = false; }, 2000); }}
        >
          {images.map((img, i) => (
            <motion.button
              key={img.id}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: Math.min(i * 0.08, 0.4), ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setLightboxIdx(i)}
              aria-label={`${eventTitle} — photo ${i + 1}`}
              className="snap-start flex-shrink-0 w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] relative aspect-[4/5] rounded-2xl overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover object-top group-hover:scale-[1.06] transition-transform duration-700 ease-out"
                sizes="(max-width: 640px) 50vw, 33vw"
                unoptimized
              />
              {/* Base vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              {/* Gold ring on hover */}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-transparent group-hover:ring-gold/30 transition-all duration-300" />
              {/* Expand icon bottom-right */}
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <ChevronRight size={13} className="text-white/80 -rotate-45 translate-x-[1px] -translate-y-[1px]" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      {images.length > 3 && (
        <div className="flex justify-center gap-2 mt-5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                const el = scrollRef.current;
                const card = el?.querySelector("button") as HTMLElement | null;
                if (!el || !card) return;
                el.scrollTo({ left: i * (card.offsetWidth + 12), behavior: "smooth" });
              }}
              aria-label={`Go to photo ${i + 1}`}
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  i === activeIdx
                    ? "w-5 h-1.5 bg-gold"
                    : "w-1.5 h-1.5 bg-cream/20 hover:bg-cream/40"
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxIdx(null)}
          >
            <button
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              onClick={() => setLightboxIdx(null)}
            >
              <X size={18} />
            </button>

            {images.length > 1 && (
              <button
                className="absolute left-3 sm:left-6 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                onClick={e => { e.stopPropagation(); setLightboxIdx(i => i !== null ? (i - 1 + images.length) % images.length : null); }}
              >
                <ChevronLeft size={22} />
              </button>
            )}

            <motion.div
              key={lightboxIdx}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[lightboxIdx].fullSrc}
                alt={images[lightboxIdx].alt}
                className="max-h-[88vh] max-w-[88vw] object-contain rounded-xl shadow-2xl"
              />
            </motion.div>

            {images.length > 1 && (
              <button
                className="absolute right-3 sm:right-6 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                onClick={e => { e.stopPropagation(); setLightboxIdx(i => i !== null ? (i + 1) % images.length : null); }}
              >
                <ChevronRight size={22} />
              </button>
            )}

            <div className="absolute bottom-5 left-0 right-0 text-center text-xs text-white/35 pointer-events-none tabular-nums">
              {lightboxIdx + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
