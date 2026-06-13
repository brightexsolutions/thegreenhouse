"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Video, Eye, RefreshCw, Trash2, Upload, X, Link2 } from "lucide-react";
import NextImage from "next/image";
import { cn } from "@/lib/utils";

const schema = z.object({
  title:             z.string().min(3),
  subtitle:          z.string().optional(),
  event_date:        z.string().min(1, "Date required"),
  event_time:        z.string().min(1, "Time required"),
  venue_name:        z.string().optional(),
  venue_address:     z.string().optional(),
  venue_map_url:     z.string().url().optional().or(z.literal("")),
  type:              z.enum(["free", "paid"]),
  price_kes:         z.number().int().min(0).optional(),
  capacity:          z.number().int().min(1).optional(),
  status:            z.enum(["draft", "published", "live", "past", "cancelled"]),
  description:       z.string().optional(),
  theme_title:       z.string().optional(),
  theme_scripture:   z.string().optional(),
  theme_description: z.string().optional(),
  dress_code:        z.string().optional(),
  playlist_url:      z.string().url().optional().or(z.literal("")),
  feedback_url:      z.string().url().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

interface EventFormProps {
  eventId?: string;
  defaultValues?: Partial<FormData & { cover_image?: string; banner_image?: string; highlight_video?: string; slug?: string; dress_code?: string }>;
}

export function EventForm({ eventId, defaultValues }: EventFormProps) {
  const router = useRouter();
  const [uploadingCover,  setUploadingCover]  = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingVideo,  setUploadingVideo]  = useState(false);
  const [coverPath,  setCoverPath]  = useState<string | null>(defaultValues?.cover_image     ?? null);
  const [bannerPath, setBannerPath] = useState<string | null>(defaultValues?.banner_image    ?? null);
  const [videoPath,  setVideoPath]  = useState<string | null>(defaultValues?.highlight_video ?? null);
  const [bannerUrlInput, setBannerUrlInput] = useState("");
  const [coverUrlInput,  setCoverUrlInput]  = useState("");
  const [videoUrlInput,  setVideoUrlInput]  = useState("");
  const [lightboxSrc,    setLightboxSrc]    = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "free",
      status: "draft",
      ...defaultValues,
    },
  });

  const type  = watch("type");
  const isNew = !eventId;

  async function compressImage(file: File, maxPx = 1920, quality = 0.88): Promise<File> {
    return new Promise((resolve) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const { naturalWidth: w, naturalHeight: h } = img;
        const scale = Math.min(1, maxPx / Math.max(w, h));
        const canvas = document.createElement("canvas");
        canvas.width  = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          blob => resolve(blob ? new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }) : file),
          "image/jpeg",
          quality,
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  async function uploadImage(
    e: React.ChangeEvent<HTMLInputElement>,
    setLoading: (v: boolean) => void,
    setPath: (p: string) => void,
  ) {
    const raw = e.target.files?.[0];
    if (!raw) return;
    setLoading(true);
    try {
      const file = raw.type.startsWith("image/") ? await compressImage(raw) : raw;
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: formData });
      const data = await res.json();
      if (data.path) setPath(data.path);
    } finally {
      setLoading(false);
    }
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload-video", { method: "POST", body: formData });
      const data = await res.json();
      if (data.path) setVideoPath(data.path);
    } finally {
      setUploadingVideo(false);
    }
  }

  function mediaUrl(path: string | null): string | null {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-images/${path}`;
  }

  async function onSubmit(data: FormData) {
    setSubmitError(null);
    const payload = {
      ...data,
      cover_image:      coverPath  ?? undefined,
      banner_image:     bannerPath ?? undefined,
      highlight_video:  videoPath  ?? undefined,
      price_kes:   data.type === "paid" ? (data.price_kes ?? 0) : 0,
      // empty strings → null
      venue_map_url:     data.venue_map_url || null,
      playlist_url:      data.playlist_url || null,
      feedback_url:      data.feedback_url || null,
      venue_name:        data.venue_name || null,
      venue_address:     data.venue_address || null,
      theme_title:       data.theme_title || null,
      theme_scripture:   data.theme_scripture || null,
      theme_description: data.theme_description || null,
      dress_code:        data.dress_code || null,
    };

    const url    = isNew ? "/api/admin/events" : `/api/admin/events/${eventId}`;
    const method = isNew ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setSubmitError(body?.error ?? "Failed to save event");
      return;
    }

    const saved = await res.json();
    router.push(`/admin/events/${saved.id}`);
    router.refresh();
  }

  const mediaChanged = !isNew && (
    bannerPath !== (defaultValues?.banner_image ?? null) ||
    coverPath  !== (defaultValues?.cover_image  ?? null) ||
    videoPath  !== (defaultValues?.highlight_video ?? null)
  );
  const hasUnsavedChanges = !isNew && (isDirty || mediaChanged);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col min-h-full">

      <div className="flex-1 space-y-6 pb-5">

      {/* Media — Banner, Poster, Highlight video */}
      <div className="bg-white rounded-2xl border border-mist p-6 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-charcoal">Media</h3>
          <p className="text-xs text-charcoal/45 mt-0.5">Banner: wide hero background. Poster: portrait shown in event details.</p>
        </div>

        {/* Banner + Poster — side by side */}
        <div className="grid grid-cols-2 gap-4">

          {/* Banner */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-charcoal/60">Banner</span>
              <span className="text-[11px] text-charcoal/30">landscape · hero bg</span>
            </div>
            {bannerPath ? (
              <div className="rounded-2xl overflow-hidden border border-mist">
                <div className="relative h-32 bg-charcoal/5 cursor-zoom-in" onClick={() => setLightboxSrc(mediaUrl(bannerPath))}>
                  <NextImage
                    src={mediaUrl(bannerPath)!}
                    alt="Banner"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex items-center gap-1 px-2 py-1.5 bg-off-white border-t border-mist">
                  <button type="button" onClick={() => setLightboxSrc(mediaUrl(bannerPath))}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-charcoal/50 hover:text-forest hover:bg-forest/8 transition-all">
                    <Eye size={10} /> View
                  </button>
                  <label className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-charcoal/50 hover:text-forest hover:bg-forest/8 transition-all cursor-pointer">
                    <RefreshCw size={10} /> Replace
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                      onChange={(e) => uploadImage(e, setUploadingBanner, setBannerPath)} />
                  </label>
                  <button type="button" onClick={() => setBannerPath(null)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-charcoal/50 hover:text-red-500 hover:bg-red-50 transition-all ml-auto">
                    <Trash2 size={10} /> Delete
                  </button>
                </div>
                {uploadingBanner && (
                  <div className="flex items-center justify-center gap-2 py-2 text-xs text-forest">
                    <Loader2 size={12} className="animate-spin" /> Uploading…
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className={cn(
                  "flex flex-col items-center justify-center gap-2 h-28 rounded-2xl border-2 border-dashed border-mist cursor-pointer transition-all hover:border-forest/30 hover:bg-forest/3"
                )}>
                  {uploadingBanner
                    ? <Loader2 size={16} className="animate-spin text-forest" />
                    : <><Upload size={16} className="text-charcoal/25" /><span className="text-xs text-charcoal/35">Upload banner</span></>
                  }
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                    onChange={(e) => uploadImage(e, setUploadingBanner, setBannerPath)} />
                </label>
                <div className="flex items-center gap-1.5">
                  <Link2 size={11} className="text-charcoal/25 flex-shrink-0" />
                  <input
                    type="url"
                    value={bannerUrlInput}
                    onChange={e => setBannerUrlInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (bannerUrlInput.trim()) { setBannerPath(bannerUrlInput.trim()); setBannerUrlInput(""); } } }}
                    placeholder="Or paste image URL"
                    className="flex-1 px-2.5 py-1.5 rounded-xl border border-mist bg-white text-xs text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-forest/40"
                  />
                  <button type="button" onClick={() => { if (bannerUrlInput.trim()) { setBannerPath(bannerUrlInput.trim()); setBannerUrlInput(""); } }}
                    disabled={!bannerUrlInput.trim()}
                    className="px-2.5 py-1.5 rounded-xl bg-forest text-cream text-[11px] font-semibold disabled:opacity-40 hover:bg-moss transition-colors">
                    Use
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Poster */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-charcoal/60">Poster</span>
              <span className="text-[11px] text-charcoal/30">portrait · event details</span>
            </div>
            {coverPath ? (
              <div className="rounded-2xl overflow-hidden border border-mist">
                <div className="relative h-32 bg-charcoal/5 cursor-zoom-in" onClick={() => setLightboxSrc(mediaUrl(coverPath))}>
                  <NextImage
                    src={mediaUrl(coverPath)!}
                    alt="Poster"
                    fill
                    className="object-cover object-top"
                    unoptimized
                  />
                </div>
                <div className="flex items-center gap-1 px-2 py-1.5 bg-off-white border-t border-mist">
                  <button type="button" onClick={() => setLightboxSrc(mediaUrl(coverPath))}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-charcoal/50 hover:text-forest hover:bg-forest/8 transition-all">
                    <Eye size={10} /> View
                  </button>
                  <label className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-charcoal/50 hover:text-forest hover:bg-forest/8 transition-all cursor-pointer">
                    <RefreshCw size={10} /> Replace
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                      onChange={(e) => uploadImage(e, setUploadingCover, setCoverPath)} />
                  </label>
                  <button type="button" onClick={() => setCoverPath(null)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-charcoal/50 hover:text-red-500 hover:bg-red-50 transition-all ml-auto">
                    <Trash2 size={10} /> Delete
                  </button>
                </div>
                {uploadingCover && (
                  <div className="flex items-center justify-center gap-2 py-2 text-xs text-forest">
                    <Loader2 size={12} className="animate-spin" /> Uploading…
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="flex flex-col items-center justify-center gap-2 h-28 rounded-2xl border-2 border-dashed border-mist cursor-pointer transition-all hover:border-forest/30 hover:bg-forest/3">
                  {uploadingCover
                    ? <Loader2 size={16} className="animate-spin text-forest" />
                    : <><Upload size={16} className="text-charcoal/25" /><span className="text-xs text-charcoal/35">Upload poster</span></>
                  }
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                    onChange={(e) => uploadImage(e, setUploadingCover, setCoverPath)} />
                </label>
                <div className="flex items-center gap-1.5">
                  <Link2 size={11} className="text-charcoal/25 flex-shrink-0" />
                  <input
                    type="url"
                    value={coverUrlInput}
                    onChange={e => setCoverUrlInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (coverUrlInput.trim()) { setCoverPath(coverUrlInput.trim()); setCoverUrlInput(""); } } }}
                    placeholder="Or paste image URL"
                    className="flex-1 px-2.5 py-1.5 rounded-xl border border-mist bg-white text-xs text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-forest/40"
                  />
                  <button type="button" onClick={() => { if (coverUrlInput.trim()) { setCoverPath(coverUrlInput.trim()); setCoverUrlInput(""); } }}
                    disabled={!coverUrlInput.trim()}
                    className="px-2.5 py-1.5 rounded-xl bg-forest text-cream text-[11px] font-semibold disabled:opacity-40 hover:bg-moss transition-colors">
                    Use
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Highlight video — full width */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-charcoal/60">Highlight video</span>
            <span className="text-[11px] text-charcoal/30">looping clip · past event page</span>
          </div>
          {videoPath ? (
            <div className="rounded-2xl overflow-hidden border border-mist">
              <div className="relative h-56 bg-black cursor-zoom-in" onClick={() => setLightboxSrc(mediaUrl(videoPath))}>
                <video
                  src={mediaUrl(videoPath)!}
                  autoPlay loop muted playsInline
                  className="w-full h-full object-cover opacity-80"
                />
              </div>
              <div className="flex items-center gap-1 px-2 py-1.5 bg-off-white border-t border-mist">
                <button type="button" onClick={() => setLightboxSrc(mediaUrl(videoPath))}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-charcoal/50 hover:text-forest hover:bg-forest/8 transition-all">
                  <Eye size={10} /> View
                </button>
                <label className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-charcoal/50 hover:text-forest hover:bg-forest/8 transition-all cursor-pointer">
                  <RefreshCw size={10} /> Replace
                  <input type="file" accept="video/mp4,video/webm,video/quicktime" className="sr-only"
                    onChange={handleVideoUpload} />
                </label>
                <button type="button" onClick={() => setVideoPath(null)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-charcoal/50 hover:text-red-500 hover:bg-red-50 transition-all ml-auto">
                  <Trash2 size={10} /> Delete
                </button>
              </div>
              {uploadingVideo && (
                <div className="flex items-center justify-center gap-2 py-2 text-xs text-forest">
                  <Loader2 size={12} className="animate-spin" /> Uploading…
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="flex flex-col items-center justify-center gap-2 h-24 rounded-2xl border-2 border-dashed border-mist cursor-pointer transition-all hover:border-forest/30 hover:bg-forest/3">
                {uploadingVideo
                  ? <Loader2 size={16} className="animate-spin text-forest" />
                  : <><Video size={16} className="text-charcoal/25" /><span className="text-xs text-charcoal/35">Upload highlight video (MP4 · max 100MB)</span></>
                }
                <input type="file" accept="video/mp4,video/webm,video/quicktime" className="sr-only"
                  onChange={handleVideoUpload} />
              </label>
              <div className="flex items-center gap-1.5">
                <Link2 size={11} className="text-charcoal/25 flex-shrink-0" />
                <input
                  type="url"
                  value={videoUrlInput}
                  onChange={e => setVideoUrlInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (videoUrlInput.trim()) { setVideoPath(videoUrlInput.trim()); setVideoUrlInput(""); } } }}
                  placeholder="Or paste video URL"
                  className="flex-1 px-2.5 py-1.5 rounded-xl border border-mist bg-white text-xs text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-forest/40"
                />
                <button type="button" onClick={() => { if (videoUrlInput.trim()) { setVideoPath(videoUrlInput.trim()); setVideoUrlInput(""); } }}
                  disabled={!videoUrlInput.trim()}
                  className="px-2.5 py-1.5 rounded-xl bg-forest text-cream text-[11px] font-semibold disabled:opacity-40 hover:bg-moss transition-colors">
                  Use
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Basic details */}
      <div className="bg-white rounded-2xl border border-mist p-6 space-y-4">
        <h3 className="text-sm font-semibold text-charcoal">Event details</h3>

        <Field label="Title" error={errors.title?.message}>
          <input {...register("title")} placeholder="The Green House — Session 03" className={inp(!!errors.title)} />
        </Field>

        <Field label="Subtitle" error={errors.subtitle?.message}>
          <input {...register("subtitle")} placeholder="Worship & Sharing Evening" className={inp(false)} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Date" error={errors.event_date?.message}>
            <input {...register("event_date")} type="date" className={inp(!!errors.event_date)} />
          </Field>
          <Field label="Time" error={errors.event_time?.message}>
            <input {...register("event_time")} type="time" className={inp(!!errors.event_time)} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Status" error={errors.status?.message}>
            <select {...register("status")} className={inp(false)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="live">Live</option>
              <option value="past">Past</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </Field>
          <Field label="Entry type" error={errors.type?.message}>
            <select {...register("type")} className={inp(false)}>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </Field>
        </div>

        {type === "paid" && (
          <Field label="Price (KES)" error={errors.price_kes?.message}>
            <input {...register("price_kes", { valueAsNumber: true })} type="number" min="0" placeholder="500" className={inp(!!errors.price_kes)} />
          </Field>
        )}

        <Field label="Capacity (optional)" error={errors.capacity?.message}>
          <input {...register("capacity", { valueAsNumber: true })} type="number" min="1" placeholder="150" className={inp(!!errors.capacity)} />
        </Field>

        <Field label="Description">
          <textarea {...register("description")} rows={4} placeholder="What attendees can expect…" className={cn(inp(false), "resize-y min-h-[100px]")} />
        </Field>
      </div>

      {/* Venue */}
      <div className="bg-white rounded-2xl border border-mist p-6 space-y-4">
        <h3 className="text-sm font-semibold text-charcoal">Venue</h3>
        <Field label="Venue name">
          <input {...register("venue_name")} placeholder="Living Room Church, Westlands" className={inp(false)} />
        </Field>
        <Field label="Address">
          <input {...register("venue_address")} placeholder="Peponi Road, Westlands, Nairobi" className={inp(false)} />
        </Field>
        <Field label="Google Maps URL">
          <input {...register("venue_map_url")} type="url" placeholder="https://maps.google.com/…" className={inp(false)} />
        </Field>
      </div>

      {/* Theme */}
      <div className="bg-white rounded-2xl border border-mist p-6 space-y-4">
        <h3 className="text-sm font-semibold text-charcoal">Session theme</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Theme title">
            <input {...register("theme_title")} placeholder="Delusion" className={inp(false)} />
          </Field>
          <Field label="Scripture reference">
            <input {...register("theme_scripture")} placeholder="2 Timothy 4:3-6" className={inp(false)} />
          </Field>
        </div>
        <Field label="Theme description">
          <textarea {...register("theme_description")} rows={5} placeholder="A conversation about…" className={cn(inp(false), "resize-y min-h-[120px]")} />
        </Field>
      </div>

      {/* Dress code */}
      <div className="bg-white rounded-2xl border border-mist p-6 space-y-4">
        <h3 className="text-sm font-semibold text-charcoal">Dress code</h3>
        <Field label="Dress code guidance">
          <input {...register("dress_code")} placeholder="Smart casual — come comfortable, come yourself." className={inp(false)} />
        </Field>
      </div>

      {/* Links */}
      <div className="bg-white rounded-2xl border border-mist p-6 space-y-4">
        <h3 className="text-sm font-semibold text-charcoal">Links</h3>
        <Field label="Playlist URL (Spotify / Apple Music)">
          <input {...register("playlist_url")} type="url" placeholder="https://open.spotify.com/…" className={inp(false)} />
        </Field>
        <Field label="Feedback form URL">
          <input {...register("feedback_url")} type="url" placeholder="https://forms.google.com/…" className={inp(false)} />
        </Field>
      </div>

      </div>{/* end flex-1 cards */}

      {/* Action bar — fixed at bottom of scroll container */}
      <div className={`sticky bottom-0 -mx-6 px-6 py-2 border-t flex items-center justify-between gap-3 z-10 mt-auto transition-colors ${
        hasUnsavedChanges ? "bg-amber-50 border-amber-200" : "bg-off-white border-mist"
      }`}>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-forest text-cream text-sm font-semibold hover:bg-moss transition-all disabled:opacity-60 shadow-sm"
          >
            {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : isNew ? "Create event" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-full border border-mist text-charcoal/60 text-sm hover:border-charcoal/20 transition-colors"
          >
            Cancel
          </button>
          {hasUnsavedChanges && !isSubmitting && (
            <span className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Unsaved changes
            </span>
          )}
        </div>
        {submitError && (
          <p className="text-sm text-red-500 text-right">{submitError}</p>
        )}
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxSrc(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={20} />
          </button>
          {lightboxSrc.match(/\.(mp4|webm|mov|MOV)$/) ? (
            <video
              src={lightboxSrc}
              controls
              autoPlay
              className="max-w-full max-h-[88vh] rounded-2xl shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightboxSrc}
              alt="Preview"
              className="max-w-full max-h-[88vh] object-contain rounded-2xl shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </form>
  );
}

function inp(hasError: boolean) {
  return cn(
    "w-full px-4 py-2.5 rounded-xl border text-sm text-charcoal bg-off-white placeholder:text-charcoal/30",
    "focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40 transition-all",
    hasError ? "border-red-300" : "border-mist"
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-charcoal/70">{label}</label>
      {children}
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
