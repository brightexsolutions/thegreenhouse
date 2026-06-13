"use client";

import { useState } from "react";
import { Copy, Check, MessageCircle, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  url: string;
  title: string;
  date: string;
  variant: "card" | "poster";
  message?: string;
}

export function EventShareButtons({ url, title, date, variant, message }: Props) {
  const [copied, setCopied] = useState(false);

  const shareText = message
    ? `${message}: ${title} — ${date}`
    : `${title} — ${date}. Reserve your spot:`;

  const waUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`;
  const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText}`)}&url=${encodeURIComponent(url)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select a hidden input
    }
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title, text: shareText, url }).catch(() => {});
    }
  }

  if (variant === "poster") {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium hover:bg-white/30 transition-colors"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copied" : "Copy link"}
        </button>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium hover:bg-white/30 transition-colors"
        >
          <MessageCircle size={11} />
          WhatsApp
        </a>
      </div>
    );
  }

  // card variant
  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={copyLink}
        className={cn(
          "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-colors flex-1 justify-center",
          copied
            ? "bg-forest/10 text-forest border border-forest/20"
            : "bg-mist text-charcoal/70 hover:bg-mist/80 border border-mist"
        )}
      >
        {copied ? <Check size={11} /> : <Copy size={11} />}
        {copied ? "Copied!" : "Copy link"}
      </button>
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/20 text-xs font-medium hover:bg-[#25D366]/15 transition-colors flex-1 justify-center"
      >
        <MessageCircle size={11} />
        WhatsApp
      </a>
      {hasNativeShare ? (
        <button
          onClick={nativeShare}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-mist text-charcoal/70 border border-mist text-xs font-medium hover:bg-mist/80 transition-colors flex-1 justify-center"
        >
          <Share2 size={11} />
          More
        </button>
      ) : (
        <a
          href={twUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-mist text-charcoal/70 border border-mist text-xs font-medium hover:bg-mist/80 transition-colors flex-1 justify-center"
        >
          <Share2 size={11} />
          Share
        </a>
      )}
    </div>
  );
}
