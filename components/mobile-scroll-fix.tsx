"use client";

import { useEffect } from "react";

/**
 * Scrolls focused inputs/textareas into view when the virtual keyboard appears.
 *
 * iOS Safari: keyboard overlays the viewport — window.innerHeight never changes,
 * but window.visualViewport resizes. We listen to that resize event.
 *
 * Android Chrome: keyboard resizes the viewport — visualViewport also fires resize.
 *
 * Both platforms: visualViewport.resize is the single reliable signal.
 * Fallback for browsers without visualViewport: use focusin + timeout.
 */
export function MobileScrollFix() {
  useEffect(() => {
    // Only run on touch-capable devices
    if (typeof window === "undefined" || !("ontouchstart" in window)) return;

    let focusedInput: HTMLElement | null = null;

    function onFocusIn(e: FocusEvent) {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT") {
        focusedInput = t;
      }
    }

    function onFocusOut() {
      focusedInput = null;
    }

    function scrollFocusedIntoView() {
      if (!focusedInput) return;
      const el = focusedInput;
      // Small delay lets layout settle after the viewport resize
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 60);
    }

    document.addEventListener("focusin", onFocusIn, { passive: true });
    document.addEventListener("focusout", onFocusOut, { passive: true });

    if (window.visualViewport) {
      // Primary path: works on iOS Safari + Android Chrome
      window.visualViewport.addEventListener("resize", scrollFocusedIntoView, { passive: true });
    } else {
      // Fallback: no visualViewport API — scroll on focus with a fixed delay
      const onFocusInFallback = (e: FocusEvent) => {
        const t = e.target as HTMLElement;
        if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT") {
          setTimeout(() => t.scrollIntoView({ behavior: "smooth", block: "center" }), 350);
        }
      };
      document.addEventListener("focusin", onFocusInFallback, { passive: true });
      return () => {
        document.removeEventListener("focusin", onFocusIn);
        document.removeEventListener("focusout", onFocusOut);
        document.removeEventListener("focusin", onFocusInFallback);
      };
    }

    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      window.visualViewport?.removeEventListener("resize", scrollFocusedIntoView);
    };
  }, []);

  return null;
}
