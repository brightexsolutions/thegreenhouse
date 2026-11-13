"use client";

import { useEffect } from "react";
import Link from "next/link";

/** Shown when a public page throws while rendering, in place of a blank screen. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-forest flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="label-caps text-gold mb-4">Something went wrong</p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-cream mb-4 leading-tight text-balance">
          This page could not be loaded
        </h1>
        <p className="text-cream/75 text-base leading-relaxed mb-8">
          It is on our side, not yours. Try again in a moment.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="px-7 py-3.5 rounded bg-gold text-forest font-semibold text-sm hover:bg-gold-light transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-7 py-3.5 rounded border border-cream/30 text-cream font-medium text-sm hover:border-cream/60 transition-colors"
          >
            Go home
          </Link>
        </div>
        {error.digest && (
          <p className="mt-8 text-xs text-cream/50 font-mono">Reference: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
