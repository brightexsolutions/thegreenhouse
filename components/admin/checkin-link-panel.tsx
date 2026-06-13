"use client";

import { useState, useEffect } from "react";
import { Copy, RefreshCw, Check, Link as LinkIcon, ExternalLink, AlertTriangle, Loader2 } from "lucide-react";

interface CheckinLinkPanelProps {
  eventId:      string;
  eventSlug:    string;
  checkinToken: string | null;
}

export function CheckinLinkPanel({ eventId, eventSlug, checkinToken }: CheckinLinkPanelProps) {
  const [token,   setToken]   = useState(checkinToken);
  const [copied,  setCopied]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);

  const checkinUrl = token ? `${origin}/checkin/${eventSlug}?t=${token}` : null;

  async function generateToken() {
    setLoading(true);
    setConfirm(false);
    try {
      const res  = await fetch(`/api/admin/events/${eventId}/checkin-token`, { method: "POST" });
      const data = await res.json() as { token?: string };
      if (data.token) setToken(data.token);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!checkinUrl) return;
    await navigator.clipboard.writeText(checkinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="bg-white rounded-2xl border border-mist p-5">
      <div className="flex items-center gap-2 mb-1">
        <LinkIcon size={13} className="text-forest" />
        <h3 className="text-sm font-semibold text-charcoal">Check-in Link</h3>
      </div>
      <p className="text-xs text-charcoal/50 mb-4 leading-relaxed">
        Share with your door team. No admin login required — access is protected by the token in the link.
      </p>

      {!token ? (
        /* ── No token yet ── */
        <button
          onClick={generateToken}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-forest text-cream text-sm font-semibold hover:bg-moss transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading
            ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
            : <><LinkIcon size={14} /> Generate check-in link</>}
        </button>
      ) : (
        /* ── Token exists ── */
        <>
          {/* URL preview */}
          <div className="bg-off-white rounded-xl px-3 py-2.5 mb-3 border border-mist">
            <p className="text-[11px] text-charcoal/50 font-mono truncate">
              {checkinUrl}
            </p>
          </div>

          {/* Primary actions */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-forest text-cream text-xs font-semibold hover:bg-moss transition-colors"
            >
              {copied
                ? <><Check size={13} /> Copied!</>
                : <><Copy size={13} /> Copy link</>}
            </button>
            <a
              href={checkinUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-forest/30 text-forest text-xs font-semibold hover:bg-forest/5 transition-colors"
            >
              <ExternalLink size={13} /> Open
            </a>
          </div>

          {/* Regenerate — behind a confirm step */}
          {!confirm ? (
            <button
              onClick={() => setConfirm(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] text-charcoal/35 hover:text-charcoal/60 transition-colors"
            >
              <RefreshCw size={11} />
              Regenerate link
            </button>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2.5">
              <div className="flex items-start gap-2">
                <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  This will invalidate the current link. You&apos;ll need to share the new one with your door team.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={generateToken}
                  disabled={loading}
                  className="flex-1 py-2 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {loading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                  {loading ? "Regenerating…" : "Yes, regenerate"}
                </button>
                <button
                  onClick={() => setConfirm(false)}
                  className="flex-1 py-2 rounded-lg border border-mist text-xs text-charcoal/60 hover:border-charcoal/30 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
