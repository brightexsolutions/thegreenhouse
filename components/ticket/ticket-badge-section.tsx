"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Download, Sparkles } from "lucide-react";
import { BadgeCustomizerModal, BadgePromptDialog } from "@/components/ticket/badge-customizer";
import type { BadgeProps } from "@/components/ticket/badge-customizer";

interface Props extends BadgeProps {
  pdfUrl:       string;
  firstName:    string;
  lastName:     string;
}

export function TicketBadgeSection({ pdfUrl, ...badgeProps }: Props) {
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [promptOpen,     setPromptOpen]     = useState(false);
  const [promptShown,    setPromptShown]    = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const showPrompt = useCallback(() => {
    if (promptShown) return;
    setPromptShown(true);
    setPromptOpen(true);
  }, [promptShown]);

  // Scroll trigger — show prompt when this section enters the viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) showPrompt(); },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [showPrompt]);

  function handleDownloadClick() {
    // Show prompt then let the link proceed (slight delay so prompt renders first)
    showPrompt();
  }

  return (
    <>
      {/* Download PDF — intercepts to show badge prompt */}
      <a
        href={pdfUrl}
        onClick={handleDownloadClick}
        className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-full text-sm font-semibold transition-all duration-200"
        style={{ background: "#1b3a2a", color: "#f7f2e8" }}
      >
        <Download size={15} />
        Download PDF ticket
      </a>

      {/* Badge section — appears below the ticket card, triggers prompt on scroll */}
      <div ref={sectionRef} className="w-full max-w-sm mt-8">
        <div
          className="relative rounded-3xl overflow-hidden p-6 text-center"
          style={{ background: "linear-gradient(145deg,#1b3a2a 0%,#0d2218 60%,#1b3a2a 100%)" }}
        >
          {/* Decorative glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%,rgba(201,162,74,0.2),transparent)" }} />
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle,#c9a24a 1px,transparent 1px)", backgroundSize: "22px 22px" }} />

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c9a24a]/15 border border-[#c9a24a]/25 mb-4">
              <Sparkles size={10} className="text-[#c9a24a]" />
              <span className="text-[10px] font-semibold text-[#c9a24a] uppercase tracking-wider">Digital badge</span>
            </div>

            <h3 className="font-display text-lg font-semibold text-[#f7f2e8] mb-2 leading-snug">
              Customize &amp; share your badge
            </h3>
            <p className="text-xs text-[#f7f2e8]/50 leading-relaxed mb-5">
              Add your photo, choose a style and post it — invite your community to come along!
            </p>

            <button
              onClick={() => setCustomizerOpen(true)}
              className="w-full py-3 rounded-2xl bg-[#c9a24a] text-[#1b3a2a] text-sm font-bold hover:bg-[#e4c97e] transition-colors"
            >
              Create my badge
            </button>

            <p className="text-[10px] text-[#f7f2e8]/25 mt-3">
              For Instagram stories, WhatsApp &amp; Facebook
            </p>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <BadgePromptDialog
        {...badgeProps}
        open={promptOpen}
        onClose={() => setPromptOpen(false)}
        onCustomize={() => setCustomizerOpen(true)}
      />
      <BadgeCustomizerModal
        {...badgeProps}
        open={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
      />
    </>
  );
}
