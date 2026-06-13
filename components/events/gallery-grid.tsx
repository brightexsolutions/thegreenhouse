"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";

export interface GalleryGridImage {
  id:       string;
  src:      string;
  fullSrc:  string;
  alt:      string;
  aspect:   string;
  caption:  string | null;
  eventTitle: string | null;
  eventSlug:  string | null;
}

interface Props {
  images: GalleryGridImage[];
}

export function GalleryGrid({ images }: Props) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

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

  return (
    <>
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setLightboxIdx(i)}
            className={`group relative overflow-hidden rounded-2xl mb-3 break-inside-avoid w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest ${img.aspect}`}
            aria-label={img.alt}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />

            {(img.caption || img.eventTitle) && (
              <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <div className="bg-black/70 backdrop-blur-sm rounded-xl px-3 py-2">
                  {img.caption && <p className="text-cream text-sm">{img.caption}</p>}
                  {img.eventTitle && img.eventSlug && (
                    <span
                      className="text-gold/80 text-xs flex items-center gap-1 mt-0.5 hover:text-gold"
                      onClick={e => e.stopPropagation()}
                    >
                      <Link href={`/events/${img.eventSlug}`} className="flex items-center gap-1">
                        {img.eventTitle} <ArrowUpRight size={10} />
                      </Link>
                    </span>
                  )}
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
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
              onClick={e => {
                e.stopPropagation();
                setLightboxIdx(i => i !== null ? (i - 1 + images.length) % images.length : null);
              }}
            >
              <ChevronLeft size={22} />
            </button>
          )}

          <div className="relative" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[lightboxIdx].fullSrc}
              alt={images[lightboxIdx].alt}
              className="max-h-[88vh] max-w-[88vw] object-contain rounded-xl shadow-2xl"
            />
            {(images[lightboxIdx].caption || images[lightboxIdx].eventTitle) && (
              <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-black/60 backdrop-blur-sm rounded-b-xl">
                {images[lightboxIdx].caption && (
                  <p className="text-cream/80 text-sm">{images[lightboxIdx].caption}</p>
                )}
                {images[lightboxIdx].eventTitle && images[lightboxIdx].eventSlug && (
                  <Link
                    href={`/events/${images[lightboxIdx].eventSlug}`}
                    className="text-gold/70 text-xs flex items-center gap-1 mt-0.5 hover:text-gold"
                    onClick={e => e.stopPropagation()}
                  >
                    {images[lightboxIdx].eventTitle} <ArrowUpRight size={10} />
                  </Link>
                )}
              </div>
            )}
          </div>

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

          <div className="absolute bottom-5 left-0 right-0 text-center text-xs text-white/40 pointer-events-none">
            {lightboxIdx + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
