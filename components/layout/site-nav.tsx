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

export function SiteNav() {
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
            : "bg-transparent"
        )}
      >
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            {/* Leaf mark */}
            <span
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-300",
                solid ? "bg-forest" : "bg-cream"
              )}
            >
              <svg viewBox="0 0 24 24" className={cn("w-4 h-4", solid ? "text-gold" : "text-forest")} fill="currentColor">
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-13 6 0-4 5-8 12-9C21 0 14 0 11 4c-2 3-4 7-4 11a8 8 0 0 0 4 7c2-5 5-10 6-14z"/>
              </svg>
            </span>
            <span
              className={cn(
                "font-display font-semibold text-base tracking-tight transition-colors duration-300",
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
                        : "text-cream/80 hover:text-cream after:w-0 hover:after:w-full"
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          {/* CTA + mobile toggle */}
          <div className="flex items-center gap-3">
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
            <Link
              href="/events"
              className="mt-6 w-full text-center px-5 py-3 rounded-full bg-forest text-cream font-semibold text-sm hover:bg-moss transition-colors"
            >
              Join a Session
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
