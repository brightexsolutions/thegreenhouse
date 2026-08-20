"use client";

import Image from "next/image";
import { useState } from "react";
import { storageUrl } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface PhotoProps {
  /** Supabase Storage path inside the event-images bucket, or a full https URL. */
  src:       string | null | undefined;
  alt:       string;
  width?:    number;
  quality?:  number;
  sizes?:    string;
  priority?: boolean;
  className?: string;
  /** Extra classes for the fallback panel, to match the surrounding design. */
  fallbackClassName?: string;
}

/**
 * A photograph that fails on purpose.
 *
 * When the Cloudinary account was deleted, every picture on the site turned
 * into a browser broken-image glyph sitting in a transparent box. The page did
 * not look broken enough to notice quickly, and looked wrong enough to put a
 * visitor off. A missing photograph should read as a deliberate dark panel
 * instead, which is what this renders when the image will not load or when
 * there is nothing to load.
 *
 * Any image can fail: a deleted host, a blocked domain, an offline visitor.
 * This is not a Cloudinary-specific patch.
 */
export function Photo({
  src, alt, width = 900, quality = 75, sizes, priority, className, fallbackClassName,
}: PhotoProps) {
  const [failed, setFailed] = useState(false);

  const resolved = !src
    ? null
    : src.startsWith("http")
      ? src
      : storageUrl(`event-images/${src}`, { width, quality });

  if (!resolved || failed) {
    return (
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-[#1b3a2a] to-[#050a06]",
          fallbackClassName
        )}
      />
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
      // Cloudinary is gone and Supabase resizes through its own transform
      // endpoint, so Vercel's image optimisation quota is never touched.
      unoptimized
    />
  );
}
