"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, CheckCircle2, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  slug: string;
}

const MAX_MB    = 2;
const MAX_BYTES = MAX_MB * 1024 * 1024;
const MAX_PHOTOS = 3;

function getUploadCount(slug: string): number {
  try { return parseInt(localStorage.getItem(`photo_uploads_${slug}`) ?? "0", 10) || 0; }
  catch { return 0; }
}
function incrementUploadCount(slug: string) {
  try { localStorage.setItem(`photo_uploads_${slug}`, String(getUploadCount(slug) + 1)); }
  catch { /* ignore */ }
}

export function AttendeePhotoShare({ slug }: Props) {
  const [open,        setOpen]        = useState(false);
  const [file,        setFile]        = useState<File | null>(null);
  const [preview,     setPreview]     = useState<string | null>(null);
  const [caption,     setCaption]     = useState("");
  const [name,        setName]        = useState("");
  const [uploading,   setUploading]   = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [uploadCount, setUploadCount] = useState(0);

  // Hydrate from localStorage after mount to avoid SSR/client mismatch
  useEffect(() => { setUploadCount(getUploadCount(slug)); }, [slug]);
  const inputRef = useRef<HTMLInputElement>(null);

  const atLimit = uploadCount >= MAX_PHOTOS;

  function pickFile(f: File) {
    setError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setError("Please select a JPEG, PNG, or WebP photo.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError(`Photo is too large (${(f.size / 1024 / 1024).toFixed(1)}MB). Please resize to under ${MAX_MB}MB.`);
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }

  async function submit() {
    if (!file) return;
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    if (caption.trim()) form.append("caption", caption.trim());
    if (name.trim())    form.append("submitted_by", name.trim());

    const res = await fetch(`/api/live/${slug}/photos`, { method: "POST", body: form });
    if (res.ok) {
      incrementUploadCount(slug);
      setUploadCount(getUploadCount(slug));
      setSuccess(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Upload failed. Please try again.");
    }
    setUploading(false);
  }

  function reset() {
    setFile(null); setPreview(null); setCaption(""); setName("");
    setError(null); setSuccess(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => { if (!atLimit) setOpen(true); }}
        disabled={atLimit}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all",
          atLimit
            ? "bg-charcoal/4 border-mist cursor-not-allowed"
            : "bg-forest/6 hover:bg-forest/10 border-forest/15"
        )}
      >
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
          atLimit ? "bg-charcoal/8" : "bg-forest/10"
        )}>
          <Camera size={16} className={atLimit ? "text-charcoal/30" : "text-forest"} />
        </div>
        <div className="text-left flex-1">
          <p className={cn("text-sm font-semibold", atLimit ? "text-charcoal/40" : "text-forest")}>
            Share a photo from the session
          </p>
          <p className="text-xs text-charcoal/50 mt-0.5">
            {atLimit
              ? `You've shared ${MAX_PHOTOS} photos — limit reached`
              : `Got a great shot? Drop it here · ${MAX_PHOTOS - uploadCount} remaining`}
          </p>
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-forest/20 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-mist">
        <div className="flex items-center gap-2">
          <Camera size={14} className="text-forest" />
          <p className="text-sm font-semibold text-forest">Share a photo</p>
        </div>
        <button onClick={() => { setOpen(false); reset(); }} className="p-1.5 rounded-lg text-charcoal/35 hover:text-charcoal hover:bg-charcoal/8 transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {success ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-green-500" />
            </div>
            <p className="text-sm font-semibold text-charcoal">Photo shared!</p>
            <p className="text-xs text-charcoal/50">Thanks for sharing the moment.</p>
            {uploadCount < MAX_PHOTOS ? (
              <button
                onClick={reset}
                className="mt-1 px-4 py-2 rounded-full border border-mist text-xs text-charcoal/60 hover:border-forest/30 hover:text-forest transition-colors"
              >
                Share another · {MAX_PHOTOS - uploadCount} left
              </button>
            ) : (
              <p className="text-xs text-charcoal/35 mt-1">You&apos;ve reached the {MAX_PHOTOS}-photo limit</p>
            )}
          </div>
        ) : (
          <>
            {/* File picker */}
            {!file ? (
              <div
                className="border-2 border-dashed border-mist rounded-2xl p-6 text-center cursor-pointer hover:border-forest/40 hover:bg-forest/3 transition-all"
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = ""; }}
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
                {preview && <img src={preview} alt="Preview" className="w-full h-full object-cover" />}
                <button
                  onClick={() => { setFile(null); setPreview(null); setError(null); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <X size={13} className="text-white" />
                </button>
                <div className="absolute bottom-2 left-2 text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded-full">
                  {(file.size / 1024).toFixed(0)}KB
                </div>
              </div>
            )}

            {/* Optional fields */}
            <input
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Add a caption (optional)"
              maxLength={120}
              className="w-full px-3 py-2.5 rounded-xl border border-mist text-sm focus:outline-none focus:border-forest transition-colors"
            />
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name (optional)"
              maxLength={60}
              className="w-full px-3 py-2.5 rounded-xl border border-mist text-sm focus:outline-none focus:border-forest transition-colors"
            />

            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100">
                <X size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <button
              onClick={submit}
              disabled={!file || uploading}
              className={cn(
                "w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
                file && !uploading
                  ? "bg-forest text-cream hover:bg-moss"
                  : "bg-charcoal/8 text-charcoal/30 cursor-not-allowed"
              )}
            >
              {uploading ? (
                <><Loader2 size={14} className="animate-spin" /> Sharing…</>
              ) : (
                <><ImageIcon size={14} /> Share photo</>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
