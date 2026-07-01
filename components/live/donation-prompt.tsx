"use client";

import { useEffect, useRef, useState } from "react";
import { X, Heart, Smartphone, MessageCircle, Camera, Upload, Loader2, CheckCircle2, ImageIcon } from "lucide-react";

interface GivingDetails {
  paybill?: string | null;
  account?: string | null;
  till?:    string | null;
  phone?:   string | null;
}

interface Props {
  eventId: string;
  slug:    string;
  giving:  GivingDetails;
  /** Delay in ms before the give prompt appears. Default: 3 minutes. */
  delayMs?: number;
}

const GIVE_KEY  = "gh_donation_dismissed_at";
const SNOOZE_MS = 25 * 60 * 1000;

const MAX_MB     = 2;
const MAX_BYTES  = MAX_MB * 1024 * 1024;
const MAX_PHOTOS = 3;

function getUploadCount(slug: string): number {
  try { return parseInt(localStorage.getItem(`photo_uploads_${slug}`) ?? "0", 10) || 0; }
  catch { return 0; }
}
function incrementUploadCount(slug: string) {
  try { localStorage.setItem(`photo_uploads_${slug}`, String(getUploadCount(slug) + 1)); }
  catch { /* ignore */ }
}

type Panel = "give" | "feedback" | "photo" | null;

export function DonationPrompt({ eventId, slug, giving, delayMs = 3 * 60 * 1000 }: Props) {
  const [fabVisible, setFabVisible] = useState(false);
  const [panel,      setPanel]      = useState<Panel>(null);

  // Feedback form state
  const [name,       setName]       = useState("");
  const [anonymous,  setAnonymous]  = useState(false);
  const [message,    setMessage]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [fbError,    setFbError]    = useState<string | null>(null);

  // Photo upload state
  const [photoFile,     setPhotoFile]     = useState<File | null>(null);
  const [photoPreview,  setPhotoPreview]  = useState<string | null>(null);
  const [photoCaption,  setPhotoCaption]  = useState("");
  const [photoName,     setPhotoName]     = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoSuccess,  setPhotoSuccess]  = useState(false);
  const [photoError,    setPhotoError]    = useState<string | null>(null);
  const [uploadCount,   setUploadCount]   = useState(0);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const hasPayment = giving.paybill || giving.till || giving.phone;
  const atPhotoLimit = uploadCount >= MAX_PHOTOS;

  useEffect(() => {
    setUploadCount(getUploadCount(slug));
  }, [slug]);

  useEffect(() => {
    const t1 = setTimeout(() => setFabVisible(true), 3000);

    const dismissed = localStorage.getItem(GIVE_KEY);
    if (dismissed) {
      const elapsed = Date.now() - Number(dismissed);
      if (elapsed >= SNOOZE_MS && hasPayment) {
        const t2 = setTimeout(() => { setPanel("give"); }, delayMs);
        return () => { clearTimeout(t1); clearTimeout(t2); };
      }
    } else if (hasPayment) {
      const t2 = setTimeout(() => { setPanel("give"); }, delayMs);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }

    return () => clearTimeout(t1);
  }, [delayMs, hasPayment]);

  function closePanel() {
    if (panel === "give") localStorage.setItem(GIVE_KEY, String(Date.now()));
    setPanel(null);
  }

  async function submitFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    setFbError(null);
    try {
      const res = await fetch("/api/feedback", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          name:     anonymous ? undefined : name.trim() || undefined,
          message:  message.trim(),
          attended: true,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch {
      setFbError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function pickPhotoFile(f: File) {
    setPhotoError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setPhotoError("Please select a JPEG, PNG, or WebP photo.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setPhotoError(`Photo is too large (${(f.size / 1024 / 1024).toFixed(1)}MB). Max ${MAX_MB}MB.`);
      return;
    }
    setPhotoFile(f);
    const reader = new FileReader();
    reader.onload = e => setPhotoPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }

  async function submitPhoto() {
    if (!photoFile) return;
    setPhotoUploading(true);
    setPhotoError(null);
    const form = new FormData();
    form.append("file", photoFile);
    if (photoCaption.trim()) form.append("caption", photoCaption.trim());
    if (photoName.trim())    form.append("submitted_by", photoName.trim());
    const res = await fetch(`/api/live/${slug}/photos`, { method: "POST", body: form });
    if (res.ok) {
      incrementUploadCount(slug);
      setUploadCount(getUploadCount(slug));
      setPhotoSuccess(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setPhotoError(data.error ?? "Upload failed. Please try again.");
    }
    setPhotoUploading(false);
  }

  function resetPhoto() {
    setPhotoFile(null); setPhotoPreview(null); setPhotoCaption(""); setPhotoName("");
    setPhotoError(null); setPhotoSuccess(false);
  }

  if (!fabVisible) return null;

  return (
    <>
      {/* Backdrop when a panel is open */}
      {panel && (
        <div className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]" onClick={closePanel} aria-hidden />
      )}

      {/* Panel */}
      {panel && (
        <div
          role="dialog"
          className="fixed z-50 bottom-0 left-0 right-0 sm:bottom-6 sm:right-6 sm:left-auto sm:w-[340px] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
          style={{ animation: "livePanel 0.35s cubic-bezier(0.32,0.72,0,1) both" }}
        >
          <style>{`@keyframes livePanel{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}`}</style>

          {/* ── Give panel ── */}
          {panel === "give" && (
            <>
              <div className="relative bg-forest px-6 pt-6 pb-5 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_-10%,rgba(201,162,74,0.15),transparent)]" />
                <button onClick={closePanel} aria-label="Close" className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <X size={13} className="text-cream/70" />
                </button>
                <div className="relative flex items-start gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Heart size={16} className="text-gold" />
                  </div>
                  <div>
                    <p className="text-[10px] label-caps text-gold/70 mb-0.5">Support the mission</p>
                    <h3 className="font-display text-xl font-semibold text-cream leading-tight">Give now</h3>
                    <p className="text-cream/55 text-xs mt-1 leading-relaxed">
                      Venue, production, outreach — your contribution keeps this going.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white px-6 pt-5 pb-6 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Smartphone size={13} className="text-forest/60" />
                  <span className="text-xs font-semibold text-charcoal/70">Via M-Pesa</span>
                </div>
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
                {giving.till && !giving.paybill && (
                  <div className="rounded-2xl bg-off-white border border-mist px-4 py-3">
                    <p className="text-[10px] label-caps text-charcoal/40 mb-2">Buy Goods</p>
                    <PayRow step="1" label="Till number" value={giving.till} />
                  </div>
                )}
                {giving.phone && (
                  <div className="rounded-2xl bg-off-white border border-mist px-4 py-3">
                    <p className="text-[10px] label-caps text-charcoal/40 mb-2">Send Money</p>
                    <PayRow step="1" label="Phone" value={giving.phone} />
                  </div>
                )}
                <button onClick={closePanel} className="w-full py-2.5 rounded-full border border-mist text-xs text-charcoal/50 hover:border-forest/20 hover:text-forest transition-all mt-1">
                  Maybe later
                </button>
              </div>
            </>
          )}

          {/* ── Feedback panel ── */}
          {panel === "feedback" && (
            <>
              <div className="relative bg-forest px-6 pt-6 pb-5 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_-10%,rgba(201,162,74,0.10),transparent)]" />
                <button onClick={closePanel} aria-label="Close" className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <X size={13} className="text-cream/70" />
                </button>
                <div className="relative flex items-start gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageCircle size={16} className="text-gold" />
                  </div>
                  <div>
                    <p className="text-[10px] label-caps text-gold/70 mb-0.5">Share your heart</p>
                    <h3 className="font-display text-xl font-semibold text-cream leading-tight">
                      {submitted ? "Thank you." : "Leave a reflection"}
                    </h3>
                    <p className="text-cream/55 text-xs mt-1 leading-relaxed">
                      {submitted ? "Your words mean a lot to us." : "What's on your heart right now?"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white px-6 pt-5 pb-6">
                {submitted ? (
                  <button onClick={closePanel} className="w-full py-2.5 rounded-full bg-forest text-cream text-xs font-semibold hover:bg-moss transition-colors">
                    Close
                  </button>
                ) : (
                  <form onSubmit={submitFeedback} className="space-y-3">
                    {!anonymous && (
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Your name (optional)"
                        maxLength={80}
                        className="w-full px-4 py-2.5 rounded-xl border border-mist text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 placeholder:text-charcoal/30"
                      />
                    )}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} className="w-3.5 h-3.5 rounded accent-forest" />
                      <span className="text-xs text-charcoal/50">Stay anonymous</span>
                    </label>
                    <div>
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value.slice(0, 280))}
                        placeholder="What's moved you today?"
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-mist text-sm resize-none focus:outline-none focus:ring-2 focus:ring-forest/20 placeholder:text-charcoal/30"
                      />
                      <span className="text-[11px] text-charcoal/30 float-right">{message.length}/280</span>
                    </div>
                    {fbError && <p className="text-xs text-red-500">{fbError}</p>}
                    <button
                      type="submit"
                      disabled={submitting || !message.trim()}
                      className="w-full py-2.5 rounded-full bg-forest text-cream text-xs font-semibold hover:bg-moss transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
                    >
                      {submitting ? <><Loader2 size={11} className="animate-spin" /> Sending…</> : "Send reflection"}
                    </button>
                  </form>
                )}
              </div>
            </>
          )}

          {/* ── Photo panel ── */}
          {panel === "photo" && (
            <>
              <div className="relative bg-forest px-6 pt-6 pb-5 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_-10%,rgba(201,162,74,0.12),transparent)]" />
                <button onClick={closePanel} aria-label="Close" className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <X size={13} className="text-cream/70" />
                </button>
                <div className="relative flex items-start gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Camera size={16} className="text-gold" />
                  </div>
                  <div>
                    <p className="text-[10px] label-caps text-gold/70 mb-0.5">Capture the night</p>
                    <h3 className="font-display text-xl font-semibold text-cream leading-tight">
                      {photoSuccess ? "Photo shared!" : "Share a photo"}
                    </h3>
                    <p className="text-cream/55 text-xs mt-1 leading-relaxed">
                      {photoSuccess
                        ? "Thanks for capturing this moment with us."
                        : atPhotoLimit
                          ? `You've shared ${MAX_PHOTOS} photos — limit reached.`
                          : `Got a great shot? Drop it here · ${MAX_PHOTOS - uploadCount} remaining`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white px-6 pt-5 pb-6">
                {photoSuccess ? (
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 size={24} className="text-green-500" />
                    </div>
                    {uploadCount < MAX_PHOTOS ? (
                      <button
                        onClick={resetPhoto}
                        className="px-5 py-2 rounded-full border border-mist text-xs text-charcoal/60 hover:border-forest/30 hover:text-forest transition-colors"
                      >
                        Share another · {MAX_PHOTOS - uploadCount} left
                      </button>
                    ) : (
                      <button onClick={closePanel} className="w-full py-2.5 rounded-full bg-forest text-cream text-xs font-semibold hover:bg-moss transition-colors">
                        Close
                      </button>
                    )}
                  </div>
                ) : atPhotoLimit ? (
                  <button onClick={closePanel} className="w-full py-2.5 rounded-full border border-mist text-xs text-charcoal/50 hover:border-forest/20 hover:text-forest transition-all">
                    Close
                  </button>
                ) : (
                  <div className="space-y-3">
                    {!photoFile ? (
                      <div
                        className="border-2 border-dashed border-mist rounded-2xl p-6 text-center cursor-pointer hover:border-forest/40 hover:bg-forest/3 transition-all"
                        onClick={() => photoInputRef.current?.click()}
                      >
                        <input
                          ref={photoInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) pickPhotoFile(f); e.target.value = ""; }}
                        />
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-forest/8 flex items-center justify-center">
                            <Upload size={18} className="text-forest/50" />
                          </div>
                          <p className="text-sm font-medium text-charcoal/60">Tap to choose a photo</p>
                          <p className="text-xs text-charcoal/35">JPEG, PNG, or WebP · Max {MAX_MB}MB</p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative rounded-2xl overflow-hidden bg-charcoal/5 aspect-video">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {photoPreview && <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />}
                        <button
                          onClick={() => { setPhotoFile(null); setPhotoPreview(null); setPhotoError(null); }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center"
                        >
                          <X size={13} className="text-white" />
                        </button>
                        <div className="absolute bottom-2 left-2 text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded-full">
                          {(photoFile.size / 1024).toFixed(0)}KB
                        </div>
                      </div>
                    )}
                    <input
                      value={photoCaption}
                      onChange={e => setPhotoCaption(e.target.value)}
                      placeholder="Add a caption (optional)"
                      maxLength={120}
                      className="w-full px-3 py-2.5 rounded-xl border border-mist text-sm focus:outline-none focus:border-forest transition-colors"
                    />
                    <input
                      value={photoName}
                      onChange={e => setPhotoName(e.target.value)}
                      placeholder="Your name (optional)"
                      maxLength={60}
                      className="w-full px-3 py-2.5 rounded-xl border border-mist text-sm focus:outline-none focus:border-forest transition-colors"
                    />
                    {photoError && (
                      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100">
                        <X size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-600">{photoError}</p>
                      </div>
                    )}
                    <button
                      onClick={submitPhoto}
                      disabled={!photoFile || photoUploading}
                      className="w-full py-2.5 rounded-full bg-forest text-cream text-xs font-semibold hover:bg-moss transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {photoUploading
                        ? <><Loader2 size={11} className="animate-spin" /> Sharing…</>
                        : <><ImageIcon size={11} /> Share photo</>}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Persistent action pills — always visible once revealed */}
      {!panel && (
        <div className="fixed bottom-6 right-5 z-50 flex flex-col items-end gap-3" style={{ animation: "livePanel 0.3s cubic-bezier(0.32,0.72,0,1) both" }}>
          <style>{`
            @keyframes pillEntrance { 0%{opacity:0;transform:translateX(40px)} 100%{opacity:1;transform:translateX(0)} }
            @keyframes pulseRing {
              0%   { transform: scale(1);   opacity: 0.6; }
              70%  { transform: scale(1.55); opacity: 0; }
              100% { transform: scale(1.55); opacity: 0; }
            }
            @keyframes heartbeat {
              0%,100% { transform: scale(1); }
              14%     { transform: scale(1.2); }
              28%     { transform: scale(1); }
              42%     { transform: scale(1.15); }
              70%     { transform: scale(1); }
            }
            @keyframes gentleBounce {
              0%,100% { transform: translateY(0); }
              40%     { transform: translateY(-4px); }
              60%     { transform: translateY(-2px); }
            }
            @keyframes shutterFlash {
              0%,80%,100% { box-shadow: 0 0 0 0 rgba(201,162,74,0); }
              83%          { box-shadow: 0 0 0 6px rgba(201,162,74,0.5); }
              88%          { box-shadow: 0 0 0 12px rgba(201,162,74,0); }
            }
            @keyframes cameraLens {
              0%,88%,100% { transform: scale(1); }
              90%          { transform: scale(0.78); }
              94%          { transform: scale(1.1); }
              97%          { transform: scale(0.95); }
            }
          `}</style>

          {hasPayment && (
            <div className="relative" style={{ animation: "pillEntrance 0.4s 0.1s cubic-bezier(0.32,0.72,0,1) both" }}>
              <span className="absolute inset-0 rounded-full bg-gold/40 pointer-events-none" style={{ animation: "pulseRing 2.2s ease-out 1.5s infinite" }} />
              <button
                onClick={() => setPanel("give")}
                className="relative flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-forest text-cream shadow-lg hover:bg-moss active:scale-95 transition-colors"
              >
                <Heart size={13} className="text-gold" style={{ animation: "heartbeat 2.5s ease-in-out 2s infinite" }} />
                <span className="text-xs font-semibold">Give</span>
              </button>
            </div>
          )}

          <div style={{ animation: "pillEntrance 0.4s 0.25s cubic-bezier(0.32,0.72,0,1) both" }}>
            <button
              onClick={() => setPanel("feedback")}
              className="flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-white border border-mist text-charcoal shadow-md hover:border-forest/30 hover:text-forest active:scale-95 transition-all"
              style={{ animation: "gentleBounce 3s ease-in-out 3s infinite" }}
            >
              <MessageCircle size={13} className="text-forest/70" />
              <span className="text-xs font-semibold">Reflection</span>
            </button>
          </div>

          <div style={{ animation: "pillEntrance 0.4s 0.4s cubic-bezier(0.32,0.72,0,1) both" }}>
            <button
              onClick={() => !atPhotoLimit && setPanel("photo")}
              disabled={atPhotoLimit}
              className="flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-gold/15 border border-gold/35 text-charcoal shadow-md hover:bg-gold/25 hover:border-gold/50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ animation: atPhotoLimit ? undefined : "shutterFlash 5s ease-in-out 4s infinite" }}
            >
              <Camera
                size={13}
                className="text-gold"
                style={{ animation: atPhotoLimit ? undefined : "cameraLens 5s ease-in-out 4s infinite" }}
              />
              <span className="text-xs font-semibold text-charcoal/80">
                {atPhotoLimit ? "Photos sent" : "Share photo"}
              </span>
            </button>
          </div>
        </div>
      )}
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
