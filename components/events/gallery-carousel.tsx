"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

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
  const pausedRef    = useRef(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const scrollNext = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector("button") as HTMLElement | null;
    if (!card) return;
    const step  = card.offsetWidth + 12; // card width + gap-3
    const maxSc = el.scrollWidth - el.clientWidth;
    if (el.scrollLeft >= maxSc - 4) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      el.scrollBy({ left: step, behavior: "smooth" });
    }
  }, []);

  // Auto-scroll every 3.5s — only when there are more images than visible
  useEffect(() => {
    if (images.length <= 3) return;
    const id = setInterval(() => {
      if (!pausedRef.current) scrollNext();
    }, 3500);
    return () => clearInterval(id);
  }, [images.length, scrollNext]);

  // Keyboard nav for lightbox
  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")      setLightboxIdx(null);
      if (e.key === "ArrowRight")  setLightboxIdx(i => i !== null ? (i + 1) % images.length : null);
      if (e.key === "ArrowLeft")   setLightboxIdx(i => i !== null ? (i - 1 + images.length) % images.length : null);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [lightboxIdx, images.length]);

  // Prevent body scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = lightboxIdx !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightboxIdx]);

  if (!images.length) return null;

  return (
    <>
      {/* Carousel strip */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1"
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
        onTouchStart={() => { pausedRef.current = true; }}
        onTouchEnd={() => { setTimeout(() => { pausedRef.current = false; }, 2000); }}
      >
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setLightboxIdx(i)}
            aria-label={`${eventTitle} — photo ${i + 1}`}
            className="snap-start flex-shrink-0 w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] relative aspect-[4/5] rounded-2xl overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
              sizes="(max-width: 640px) 50vw, 33vw"
              unoptimized
            />
            {/* Hover veil */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300" />
            {/* Expand hint on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <ChevronRight size={16} className="text-white -rotate-45 translate-x-0.5 -translate-y-0.5" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Dot indicators — only when scrollable */}
      {images.length > 3 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                const el = scrollRef.current;
                const card = el?.querySelector("button") as HTMLElement | null;
                if (!el || !card) return;
                el.scrollTo({ left: i * (card.offsetWidth + 12), behavior: "smooth" });
              }}
              className="w-1.5 h-1.5 rounded-full bg-cream/25 hover:bg-cream/60 transition-colors"
              aria-label={`Go to photo ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxIdx(null)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            onClick={() => setLightboxIdx(null)}
          >
            <X size={18} />
          </button>

          {/* Prev */}
          {images.length > 1 && (
            <button
              className="absolute left-3 sm:left-6 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              onClick={e => {
                e.stopPropagation();
                setLightboxIdx(i => i !== null ? (i - 1 + images.length) % images.length : null);
              }}
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Image */}
          <div className="relative" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[lightboxIdx].fullSrc}
              alt={images[lightboxIdx].alt}
              className="max-h-[88vh] max-w-[88vw] object-contain rounded-xl shadow-2xl"
            />
          </div>

          {/* Next */}
          {images.length > 1 && (
            <button
              className="absolute right-3 sm:right-6 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              onClick={e => {
                e.stopPropagation();
                setLightboxIdx(i => i !== null ? (i + 1) % images.length : null);
              }}
            >
              <ChevronRight size={22} />
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-5 left-0 right-0 text-center text-xs text-white/40 pointer-events-none">
            {lightboxIdx + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
