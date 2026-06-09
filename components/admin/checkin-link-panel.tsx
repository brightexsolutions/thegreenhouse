"use client";

import { useState } from "react";
import { Copy, RefreshCw, Check, Link as LinkIcon } from "lucide-react";
import { SITE_URL } from "@/lib/constants";

interface CheckinLinkPanelProps {
  eventId:      string;
  eventSlug:    string;
  checkinToken: string | null;
}

export function CheckinLinkPanel({ eventId, eventSlug, checkinToken }: CheckinLinkPanelProps) {
  const [token,     setToken]     = useState(checkinToken);
  const [copied,    setCopied]    = useState(false);
  const [loading,   setLoading]   = useState(false);

  const checkinUrl = token
    ? `${SITE_URL}/checkin/${eventSlug}?t=${token}`
    : null;

  async function generateToken() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/checkin-token`, { method: "POST" });
      const data = await res.json();
      if (data.token) setToken(data.token);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!checkinUrl) return;
    await navigator.clipboard.writeText(checkinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white rounded-2xl border border-mist p-5">
      <div className="flex items-center gap-2 mb-3">
        <LinkIcon size={13} className="text-forest" />
        <h3 className="text-sm font-semibold text-charcoal">Check-in Link</h3>
      </div>
      <p className="text-[11px] text-charcoal/50 mb-4 leading-relaxed">
        Share this link with the door team. No login needed — token-protected.
      </p>

      {checkinUrl ? (
        <div className="bg-off-white rounded-xl px-3 py-2.5 flex items-center gap-2 mb-3">
          <p className="text-[10px] text-charcoal/60 flex-1 truncate font-mono">{checkinUrl}</p>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 text-charcoal/40 hover:text-forest transition-colors"
          >
            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
          </button>
        </div>
      ) : (
        <p className="text-[11px] text-charcoal/30 mb-3">No token generated yet.</p>
      )}

      <button
        onClick={generateToken}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs text-forest hover:underline disabled:opacity-50"
      >
        <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
        {token ? "Regenerate token" : "Generate token"}
      </button>
    </div>
  );
}
