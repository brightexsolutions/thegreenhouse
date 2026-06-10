import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-forest flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_40%,rgba(201,162,74,0.07),transparent)]" />
      <div className="absolute top-16 right-16 w-64 h-64 rounded-full border border-cream/5 hidden lg:block" />
      <div className="absolute bottom-20 left-12 w-40 h-40 rounded-full border border-gold/8 hidden lg:block" />

      <div className="relative text-center max-w-lg">
        {/* Leaf mark */}
        <div className="w-16 h-16 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center mx-auto mb-8">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-gold" fill="currentColor">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-13 6 0-4 5-8 12-9C21 0 14 0 11 4c-2 3-4 7-4 11a8 8 0 0 0 4 7c2-5 5-10 6-14z"/>
          </svg>
        </div>

        {/* 404 */}
        <p className="font-display text-8xl font-semibold text-gold/20 leading-none mb-2 select-none">404</p>

        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-cream mb-4 leading-tight">
          This page doesn&apos;t exist
        </h1>
        <p className="text-cream/60 text-base leading-relaxed mb-10 max-w-sm mx-auto">
          The link you followed may be broken, or the page may have been removed.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="px-7 py-3.5 rounded-full bg-gold text-forest font-semibold text-sm hover:bg-gold-light transition-all duration-200 hover:-translate-y-0.5"
          >
            Go home
          </Link>
          <Link
            href="/events"
            className="px-7 py-3.5 rounded-full border border-cream/20 text-cream/80 font-medium text-sm hover:border-cream/40 hover:text-cream transition-all duration-200"
          >
            See upcoming sessions
          </Link>
        </div>
      </div>
    </div>
  );
}
