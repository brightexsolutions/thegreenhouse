"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Trash2, ImageIcon, Loader2, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm-dialog";

interface Event {
  id:         string;
  title:      string;
  slug:       string;
  event_date: string;
}

interface Photo {
  id:         string;
  path:       string;
  caption:    string | null;
  sort_order: number;
  is_cover:   boolean;
  created_at: string;
}

interface PhotoMeta {
  width:   number | null;
  height:  number | null;
  size_kb: number;
}

interface Props {
  events: Event[];
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

function photoUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/event-images/${path}?width=400&quality=75`;
}
function photoFullUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/event-images/${path}`;
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export function EventPhotoUpload({ events }: Props) {
  const confirm = useConfirm();

  // Default to the most recent past event — that's almost always what you're
  // uploading photos for right after a session. Fall back to the first event
  // in the list if there are no past events yet.
  const now = new Date();
  const defaultId =
    events.find(e => new Date(e.event_date) < now)?.id ?? events[0]?.id ?? "";

  const [selectedEventId, setSelectedEventId] = useState(defaultId);
  const [photos,          setPhotos]          = useState<Photo[]>([]);
  const [photoMeta,       setPhotoMeta]       = useState<Record<string, PhotoMeta>>({});
  const [loading,         setLoading]         = useState(false);
  const [loaded,          setLoaded]          = useState<string | null>(null);
  const [dragOver,        setDragOver]        = useState(false);
  const [caption,         setCaption]         = useState("");
  const [lightbox,        setLightbox]        = useState<string | null>(null);

  // Upload queue — async for...of approach, avoids useEffect re-trigger bug
  const [uploadState, setUploadState] = useState<{
    current: string | null;  // current file name
    currentSize: number;     // bytes
    done: number;
    total: number;
  }>({ current: null, currentSize: 0, done: 0, total: 0 });

  const pendingRef    = useRef<File[]>([]);
  const processingRef = useRef(false);
  const captionRef    = useRef(caption);
  const inputRef      = useRef<HTMLInputElement>(null);

  // Keep captionRef in sync so processFiles() closure reads latest value
  useEffect(() => { captionRef.current = caption; }, [caption]);

  useEffect(() => {
    if (defaultId) loadPhotos(defaultId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPhotos(eventId: string) {
    if (!eventId) return;
    setLoading(true);
    setLoaded(eventId);
    const res = await fetch(`/api/admin/events/${eventId}/photos`);
    if (res.ok) {
      const data = await res.json();
      setPhotos(data.photos ?? []);
    }
    setLoading(false);
  }

  async function handleSelectEvent(id: string) {
    setSelectedEventId(id);
    setPhotos([]);
    setLoaded(null);
    await loadPhotos(id);
  }

  function enqueue(files: FileList | File[]) {
    const accepted = Array.from(files).filter(f =>
      ["image/jpeg", "image/png", "image/webp"].includes(f.type) && f.size <= 15 * 1024 * 1024
    );
    const skipped = files.length - accepted.length;
    if (skipped > 0) alert(`${skipped} file(s) skipped — only JPEG/PNG/WebP under 15MB accepted.`);
    if (!accepted.length) return;
    pendingRef.current = [...pendingRef.current, ...accepted];
    if (!processingRef.current) processQueue();
  }

  async function processQueue() {
    if (processingRef.current || !pendingRef.current.length) return;
    processingRef.current = true;

    while (pendingRef.current.length > 0) {
      const file = pendingRef.current[0];
      const total = pendingRef.current.length;

      setUploadState(prev => ({
        current: file.name,
        currentSize: file.size,
        done: prev.current === null ? 0 : prev.done, // reset on fresh batch
        total,
      }));

      const form = new FormData();
      form.append("file", file);
      const cap = captionRef.current.trim();
      if (cap) form.append("caption", cap);

      const res = await fetch(`/api/admin/events/${selectedEventId}/photos`, {
        method: "POST",
        body:   form,
      });

      if (res.ok) {
        const data = await res.json();
        setPhotos(prev => [...prev, data.photo]);
        if (data.meta) {
          setPhotoMeta(prev => ({ ...prev, [data.photo.id]: data.meta }));
        }
      }

      // Remove the uploaded file from queue
      pendingRef.current = pendingRef.current.slice(1);
      setUploadState(prev => ({
        ...prev,
        done: prev.done + 1,
        total: pendingRef.current.length,
      }));
    }

    // All done
    processingRef.current = false;
    setUploadState({ current: null, currentSize: 0, done: 0, total: 0 });
    setCaption("");
  }

  async function deletePhoto(photoId: string) {
    const ok = await confirm({ message: "This photo will be permanently removed.", destructive: true });
    if (!ok) return;
    const res = await fetch(`/api/admin/events/${selectedEventId}/photos`, {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ photoId }),
    });
    if (res.ok) {
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      setPhotoMeta(prev => { const n = { ...prev }; delete n[photoId]; return n; });
    }
  }

  const isUploading = uploadState.current !== null;

  return (
    <div className="flex flex-col gap-6">
      {/* Event selector */}
      <div className="bg-white rounded-2xl border border-mist p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div className="flex-1 min-w-0">
          <label className="block text-[10px] font-semibold text-charcoal/50 uppercase tracking-wider mb-1.5">
            Select event
          </label>
          <select
            value={selectedEventId}
            onChange={e => handleSelectEvent(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-mist text-sm text-charcoal focus:outline-none focus:border-forest transition-colors"
          >
            {events.map(e => (
              <option key={e.id} value={e.id}>
                {e.title.replace("The Green House — ", "")} —{" "}
                {new Date(e.event_date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
              </option>
            ))}
          </select>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-xs text-charcoal/40">
            <Loader2 size={13} className="animate-spin" /> Loading…
          </div>
        )}
      </div>

      {loaded === selectedEventId && (
        <>
          {/* Upload zone */}
          <div className="bg-white rounded-2xl border border-mist p-5 space-y-3">
            <p className="text-xs font-semibold text-charcoal/50 uppercase tracking-wider">Upload photos</p>
            <div
              className={cn(
                "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
                dragOver ? "border-forest bg-forest/5" : "border-mist hover:border-forest/40 hover:bg-forest/3"
              )}
              onClick={() => inputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault(); setDragOver(false);
                enqueue(e.dataTransfer.files);
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={e => {
                  if (e.target.files?.length) enqueue(e.target.files);
                  e.target.value = "";
                }}
              />
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={24} className="animate-spin text-forest/60" />
                  <p className="text-sm font-medium text-charcoal/60">
                    Uploading {uploadState.done + 1} of {uploadState.done + uploadState.total + 1}…
                  </p>
                  <p className="text-xs text-charcoal/30">
                    {uploadState.current} · {formatSize(uploadState.currentSize)}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload size={24} className="text-charcoal/25" />
                  <p className="text-sm font-medium text-charcoal/50">Drop photos here or click to browse</p>
                  <p className="text-xs text-charcoal/30">Select up to 10 at once · JPEG, PNG, or WebP · Max 15MB each</p>
                </div>
              )}
            </div>

            {/* Queue preview chips */}
            {pendingRef.current.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {pendingRef.current.map((f, i) => (
                  <div key={i} className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border",
                    i === 0 && isUploading
                      ? "bg-forest/10 border-forest/20 text-forest"
                      : "bg-charcoal/5 border-mist text-charcoal/50"
                  )}>
                    {i === 0 && isUploading && <Loader2 size={10} className="animate-spin" />}
                    <span>{f.name.length > 18 ? f.name.slice(0, 16) + "…" : f.name}</span>
                    <span className="opacity-60">· {formatSize(f.size)}</span>
                  </div>
                ))}
              </div>
            )}

            <input
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Caption for all photos in this batch (optional)"
              className="w-full px-3 py-2 rounded-xl border border-mist text-sm focus:outline-none focus:border-forest"
            />
          </div>

          {/* Photo grid */}
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {photos.map(photo => {
                const meta = photoMeta[photo.id];
                return (
                  <div key={photo.id} className="group relative rounded-2xl overflow-hidden bg-charcoal/5 aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoUrl(photo.path)}
                      alt={photo.caption ?? "Event photo"}
                      className="w-full h-full object-cover object-top"
                    />

                    {/* Size/resolution badge — top left */}
                    {meta && (
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-medium leading-none">
                          {meta.size_kb >= 1024
                            ? `${(meta.size_kb / 1024).toFixed(1)} MB`
                            : `${meta.size_kb} KB`}
                        </span>
                        {meta.width && meta.height && (
                          <span className="px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-medium leading-none">
                            {meta.width}×{meta.height}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Always-visible action bar at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2.5 pt-6 pb-2.5 flex items-end justify-between gap-2">
                      {photo.caption && (
                        <p className="text-[10px] text-cream/80 leading-relaxed flex-1 mr-1 line-clamp-2">
                          {photo.caption}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
                        <button
                          onClick={() => setLightbox(photoFullUrl(photo.path))}
                          title="View full size"
                          className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/35 text-white flex items-center justify-center transition-colors"
                        >
                          <ExternalLink size={11} />
                        </button>
                        <button
                          onClick={() => deletePhoto(photo.id)}
                          title="Delete photo"
                          className="w-7 h-7 rounded-lg bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-mist p-12 flex flex-col items-center gap-3 text-center">
              <ImageIcon size={26} className="text-charcoal/15" />
              <p className="text-sm text-charcoal/40">No photos uploaded yet</p>
              <p className="text-xs text-charcoal/25">Upload photos from this session above</p>
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Full size photo"
            className="max-w-full max-h-[88vh] object-contain rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
