import Link from "next/link";
import { whatsappUrl, SITE_NAME, SESSION_FREQUENCY, SOCIAL_INSTAGRAM, SOCIAL_TIKTOK, SOCIAL_YOUTUBE } from "@/lib/constants";
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
              <span className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] text-gold" fill="currentColor">
                  <g transform="translate(12,21)">
                    <path transform="rotate(-32)" d="M0 0 C-2 -2.5 -2.4 -6.5 -0.8-11.5 C-0.2-13 0.2-13 0.8-11.5 C2.4-6.5 2 -2.5 0 0Z" opacity="0.6"/>
                    <path transform="rotate(32)"  d="M0 0 C-2 -2.5 -2.4 -6.5 -0.8-11.5 C-0.2-13 0.2-13 0.8-11.5 C2.4-6.5 2 -2.5 0 0Z"/>
                  </g>
                </svg>
              </span>
              <span className="font-display font-medium text-cream text-[15px]">{SITE_NAME}</span>
            </div>
            <p className="text-sm text-cream/60 leading-relaxed max-w-xs">
              A {SESSION_FREQUENCY} cross-church gathering in Nairobi.
              Low pressure. Real connection. All are welcome.
            </p>
            <div className="flex items-center gap-2.5 mt-5">
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
              <a
                href={SOCIAL_INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-cream/20 flex items-center justify-center hover:border-gold/60 hover:text-gold transition-colors"
                aria-label="Instagram"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href={SOCIAL_TIKTOK}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-cream/20 flex items-center justify-center hover:border-gold/60 hover:text-gold transition-colors"
                aria-label="TikTok"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
                </svg>
              </a>
              <a
                href={SOCIAL_YOUTUBE}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-cream/20 flex items-center justify-center hover:border-gold/60 hover:text-gold transition-colors"
                aria-label="YouTube"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Navigate */}
          <div>
            <p className="label-caps text-gold/80 mb-4">Navigate</p>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: "Home",         href: "/" },
                { label: "About",        href: "/about" },
                { label: "Events",       href: "/events" },
                { label: "Brand System", href: "/design-system" },
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
                <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="text-cream/60 hover:text-cream transition-colors">
                  WhatsApp
                </a>
              </li>
              <li>
                <a href={SOCIAL_INSTAGRAM} target="_blank" rel="noopener noreferrer" className="text-cream/60 hover:text-cream transition-colors">
                  Instagram
                </a>
              </li>
              <li>
                <a href={SOCIAL_TIKTOK} target="_blank" rel="noopener noreferrer" className="text-cream/60 hover:text-cream transition-colors">
                  TikTok
                </a>
              </li>
              <li>
                <a href={SOCIAL_YOUTUBE} target="_blank" rel="noopener noreferrer" className="text-cream/60 hover:text-cream transition-colors">
                  YouTube
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
          "flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-cream/40"
        )}>
          <span>© {year} {SITE_NAME}. All rights reserved.</span>
          <span className="flex items-center gap-1.5">
            Built by{" "}
            <a
              href="https://brightexsolutions.co.ke"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cream/55 hover:text-gold transition-colors underline-offset-2 hover:underline"
            >
              Brightex Solutions
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
