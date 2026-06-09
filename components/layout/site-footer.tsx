import Link from "next/link";
import { whatsappUrl, SITE_NAME, SESSION_FREQUENCY } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-forest text-cream/80 overflow-hidden">
      {/* Watermark */}
      <span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{ fontSize: "clamp(5rem, 18vw, 14rem)", fontFamily: "var(--font-display)", fontWeight: 700, color: "rgba(255,255,255,0.04)", lineHeight: 1, whiteSpace: "nowrap" }}
      >
        The Green House
      </span>

      {/* Decorative top border */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      {/* Main footer grid */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-gold" fill="currentColor">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-13 6 0-4 5-8 12-9C21 0 14 0 11 4c-2 3-4 7-4 11a8 8 0 0 0 4 7c2-5 5-10 6-14z"/>
                </svg>
              </span>
              <span className="font-display font-semibold text-cream text-base">{SITE_NAME}</span>
            </div>
            <p className="text-sm text-cream/60 leading-relaxed max-w-xs">
              A {SESSION_FREQUENCY} cross-church gathering in Nairobi.
              Low pressure. Real connection. All are welcome.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a
                href={whatsappUrl("Hi, I'd like to know more about The Green House")}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-cream/20 flex items-center justify-center hover:border-gold/60 hover:text-gold transition-colors"
                aria-label="WhatsApp"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Navigate */}
          <div>
            <p className="label-caps text-gold/80 mb-4">Navigate</p>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: "Home",   href: "/" },
                { label: "About",  href: "/about" },
                { label: "Events", href: "/events" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-cream/60 hover:text-cream transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <p className="label-caps text-gold/80 mb-4">Community</p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href={whatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cream/60 hover:text-cream transition-colors"
                >
                  Join WhatsApp
                </a>
              </li>
              <li>
                <Link href="/events" className="text-cream/60 hover:text-cream transition-colors">
                  Next Session
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={cn(
          "mt-12 pt-6 border-t border-cream/10",
          "flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-cream/40"
        )}>
          <span>© {year} {SITE_NAME}. All rights reserved.</span>
          <span>Nairobi, Kenya</span>
        </div>
      </div>
    </footer>
  );
}
