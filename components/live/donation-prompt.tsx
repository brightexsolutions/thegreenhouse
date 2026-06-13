"use client";

import { useEffect, useState } from "react";
import { X, Heart, Smartphone } from "lucide-react";

interface GivingDetails {
  paybill?: string | null;
  account?: string | null;
  till?:    string | null;
  phone?:   string | null;
}

interface Props {
  giving: GivingDetails;
  /** Delay in ms before the prompt appears. Default: 3 minutes. */
  delayMs?: number;
}

const STORAGE_KEY = "gh_donation_prompt_dismissed_at";
const SNOOZE_MS   = 25 * 60 * 1000;

export function DonationPrompt({ giving, delayMs = 3 * 60 * 1000 }: Props) {
  const [state, setState] = useState<"hidden" | "pill" | "open">("hidden");

  const hasPayment = giving.paybill || giving.till || giving.phone;
  if (!hasPayment) return null;

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      const elapsed = Date.now() - Number(dismissed);
      // Was dismissed before — show pill immediately so it's always accessible
      setState("pill");
      if (elapsed < SNOOZE_MS) return;
      // Snooze expired — re-open the full prompt
      const t = setTimeout(() => setState("open"), delayMs);
      return () => clearTimeout(t);
    }
    // First time — wait then show full prompt
    const t = setTimeout(() => setState("open"), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setState("pill");
  }

  if (state === "hidden") return null;

  // Collapsed pill — always reachable after first dismiss
  if (state === "pill") {
    return (
      <button
        onClick={() => setState("open")}
        className="fixed bottom-6 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-forest text-cream shadow-lg hover:bg-moss transition-all hover:-translate-y-0.5 active:scale-95"
        style={{ animation: "slideUpPrompt 0.3s cubic-bezier(0.32,0.72,0,1) both" }}
        aria-label="Give tonight"
      >
        <style>{`@keyframes slideUpPrompt { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }`}</style>
        <Heart size={13} className="text-gold" />
        <span className="text-xs font-semibold">Give</span>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop — subtle, not blocking */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
        onClick={dismiss}
        aria-hidden
      />

      {/* Prompt card */}
      <div
        role="dialog"
        aria-label="Support The Green House"
        className="fixed z-50 bottom-0 left-0 right-0 sm:bottom-6 sm:right-6 sm:left-auto sm:w-[340px] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        style={{ animation: "slideUpPrompt 0.4s cubic-bezier(0.32,0.72,0,1) both" }}
      >
        <style>{`
          @keyframes slideUpPrompt {
            from { opacity:0; transform: translateY(32px); }
            to   { opacity:1; transform: translateY(0); }
          }
        `}</style>

        {/* Header */}
        <div className="relative bg-forest px-6 pt-6 pb-5 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_-10%,rgba(201,162,74,0.15),transparent)]" />
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X size={13} className="text-cream/70" />
          </button>
          <div className="relative flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Heart size={16} className="text-gold" />
            </div>
            <div>
              <p className="text-[10px] label-caps text-gold/70 mb-0.5">Support the mission</p>
              <h3 className="font-display text-xl font-semibold text-cream leading-tight">
                Give tonight
              </h3>
              <p className="text-cream/55 text-xs mt-1 leading-relaxed">
                Your generosity keeps The Green House going — venue, production, and everything that makes tonight possible.
              </p>
            </div>
          </div>
        </div>

        {/* Payment methods */}
        <div className="bg-white px-6 pt-5 pb-6 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Smartphone size={13} className="text-forest/60" />
            <span className="text-xs font-semibold text-charcoal/70">Via M-Pesa</span>
          </div>

          {/* Paybill */}
          {giving.paybill && (
            <div className="rounded-2xl bg-off-white border border-mist px-4 py-3">
              <p className="text-[10px] label-caps text-charcoal/40 mb-2">Paybill</p>
              <div className="space-y-1.5">
                <PayRow step="1" label="Business No." value={giving.paybill} />
                {giving.account && <PayRow step="2" label="Account No." value={giving.account} />}
                <PayRow step={giving.account ? "3" : "2"} label="Amount" value="Any amount" dim />
              </div>
            </div>
          )}

          {/* Buy Goods till */}
          {giving.till && !giving.paybill && (
            <div className="rounded-2xl bg-off-white border border-mist px-4 py-3">
              <p className="text-[10px] label-caps text-charcoal/40 mb-2">Buy Goods</p>
              <PayRow step="1" label="Till number" value={giving.till} />
            </div>
          )}

          {/* Send Money */}
          {giving.phone && (
            <div className="rounded-2xl bg-off-white border border-mist px-4 py-3">
              <p className="text-[10px] label-caps text-charcoal/40 mb-2">Send Money</p>
              <PayRow step="1" label="Phone" value={giving.phone} />
            </div>
          )}

          <button
            onClick={dismiss}
            className="w-full py-2.5 rounded-full border border-mist text-xs text-charcoal/50 hover:border-forest/20 hover:text-forest transition-all mt-1"
          >
            Maybe later
          </button>
        </div>
      </div>
    </>
  );
}

function PayRow({ step, label, value, dim }: { step: string; label: string; value: string; dim?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="w-4 h-4 rounded-full bg-forest/10 flex items-center justify-center text-[9px] font-bold text-forest/60 flex-shrink-0">{step}</span>
        <span className="text-xs text-charcoal/50">{label}</span>
      </div>
      <span className={`text-xs font-semibold ${dim ? "text-charcoal/35" : "text-forest"}`}>{value}</span>
    </div>
  );
}
