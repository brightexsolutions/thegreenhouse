"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { label: "Home",         href: "/",             exact: true  },
  { label: "About",        href: "/about",         exact: false },
  { label: "Events",       href: "/events",        exact: false },
  { label: "Gallery",      href: "/gallery",       exact: false },
  { label: "Get Involved", href: "/get-involved",  exact: false },
];

// Pages with a full-bleed dark/image hero — nav starts transparent
const HERO_ROUTES = ["/", "/about", "/events", "/gallery", "/get-involved"];

interface SiteNavProps {
  liveSlug?: string;
}

export function SiteNav({ liveSlug }: SiteNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open,     setOpen]     = useState(false);
  const pathname = usePathname();

  const hasDarkHero = HERO_ROUTES.some((r) =>
    r === "/" ? pathname === "/" : pathname === r || pathname.startsWith(r + "/")
  );
  const solid = scrolled || !hasDarkHero;

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  }

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-500",
          solid
            ? "bg-cream/95 backdrop-blur-md border-b border-mist shadow-sm"
            : "[background:linear-gradient(to_bottom,rgba(0,0,0,0.45)_0%,transparent_100%)]"
        )}
      >
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            {/* Double leaf mark */}
            <span
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300",
                solid ? "bg-forest" : "bg-cream"
              )}
            >
              <svg viewBox="0 0 24 24" className={cn("w-[18px] h-[18px]", solid ? "text-gold" : "text-forest")} fill="currentColor">
                {/* Left leaf — organic teardrop curving upper-left */}
                <path d="M12 20 C10 17 5 14 5 8 C5 4 9 2 12 5 C12 5 13 12 12 20Z" opacity="0.6"/>
                {/* Right leaf — organic teardrop curving upper-right, on top */}
                <path d="M12 20 C14 17 19 14 19 8 C19 4 15 2 12 5 C12 5 11 12 12 20Z"/>
              </svg>
            </span>
            <span
              className={cn(
                "font-display font-medium text-[15px] tracking-tight transition-colors duration-300",
                solid ? "text-forest" : "text-cream"
              )}
            >
              The Green House
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-8">
            {links.map((l) => {
              const active = isActive(l.href, l.exact);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "text-sm font-medium relative pb-0.5 transition-colors duration-200",
                    "after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:bg-gold after:transition-all after:duration-300",
                    solid
                      ? active
                        ? "text-forest after:w-full"
                        : "text-charcoal/70 hover:text-forest after:w-0 hover:after:w-full"
                      : active
                        ? "text-gold after:w-full"
                        : "text-cream hover:text-gold after:w-0 hover:after:w-full"
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          {/* CTA + mobile toggle */}
          <div className="flex items-center gap-3">
            {liveSlug && (
              <Link
                href={`/live/${liveSlug}`}
                className={cn(
                  "hidden lg:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200",
                  solid
                    ? "bg-forest/10 text-forest border border-forest/20 hover:bg-forest/15"
                    : "bg-white/10 text-cream border border-white/20 hover:bg-white/15"
                )}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gold" />
                </span>
                We&apos;re Live
              </Link>
            )}
            <Link
              href="/events"
              className={cn(
                "hidden lg:inline-flex items-center px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200",
                solid
                  ? "bg-forest text-cream hover:bg-moss"
                  : "bg-cream text-forest hover:bg-gold-pale"
              )}
            >
              Join a Session
            </Link>
            {liveSlug && (
              <Link
                href={`/live/${liveSlug}`}
                className={cn(
                  "lg:hidden inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200",
                  solid
                    ? "bg-forest/10 text-forest border border-forest/20"
                    : "bg-white/10 text-cream border border-white/20"
                )}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold" />
                </span>
                Live
              </Link>
            )}
            <button
              onClick={() => setOpen(!open)}
              className={cn(
                "lg:hidden p-2 rounded-md transition-colors",
                solid ? "text-forest hover:bg-mist" : "text-cream hover:bg-white/10"
              )}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden transition-all duration-300",
          open ? "visible" : "invisible"
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-charcoal/50 backdrop-blur-sm transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setOpen(false)}
        />
        {/* Drawer */}
        <div
          className={cn(
            "absolute top-0 right-0 h-full w-72 bg-cream shadow-2xl transition-transform duration-300 flex flex-col pt-20",
            open ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex flex-col px-6 gap-1">
            {links.map((l) => {
              const active = isActive(l.href, l.exact);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "py-3 text-base font-medium border-b border-mist transition-colors",
                    active ? "text-forest font-semibold" : "text-charcoal/70 hover:text-forest"
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
            {liveSlug && (
              <Link
                href={`/live/${liveSlug}`}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-forest/10 border border-forest/20 text-forest font-semibold text-sm hover:bg-forest/15 transition-colors"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gold" />
                </span>
                We&apos;re Live Now
              </Link>
            )}
            <Link
              href="/events"
              className="mt-3 w-full text-center px-5 py-3 rounded-full bg-forest text-cream font-semibold text-sm hover:bg-moss transition-colors"
            >
              Join a Session
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
