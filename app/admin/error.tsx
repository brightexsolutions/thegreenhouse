"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

/** Keeps the sidebar and topbar on screen when one admin page fails. */
export default function AdminError({
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
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle size={20} className="text-red-600" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-forest mb-2">This page failed to load</h1>
        <p className="text-sm text-charcoal/70 leading-relaxed mb-6">
          The rest of the admin panel is still working. Try again, and if it keeps happening check System, then Logs.
        </p>
        <button
          type="button"
          onClick={reset}
          className="px-5 py-2.5 rounded bg-forest text-cream text-sm font-semibold hover:bg-moss transition-colors"
        >
          Try again
        </button>
        {error.digest && (
          <p className="mt-6 text-xs text-charcoal/60 font-mono">Reference: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
