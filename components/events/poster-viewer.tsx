"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface Props {
  src:               string;
  fullSrc:           string;
  title:             string;
  thumbnailClassName?: string;
}

export function PosterViewer({ src, fullSrc, title, thumbnailClassName }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={thumbnailClassName ?? "relative w-20 rounded-xl overflow-hidden shadow-md border border-mist flex-shrink-0 hover:shadow-lg transition-shadow"}
        style={{ aspectRatio: "3/4" }}
        aria-label="View event poster"
      >
        <Image src={src} alt={`${title} poster`} fill className="object-cover" unoptimized />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fullSrc}
            alt={`${title} poster`}
            className="max-w-full max-h-[88vh] object-contain rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
