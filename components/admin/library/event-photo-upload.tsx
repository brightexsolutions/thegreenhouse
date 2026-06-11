"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Trash2, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Event {
  id:    string;
  title: string;
  slug:  string;
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

interface Props {
  events: Event[];
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

function photoUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/event-images/${path}?width=400&quality=75`;
}

export function EventPhotoUpload({ events }: Props) {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? "");
  const [photos,    setPhotos]    = useState<Photo[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [caption,   setCaption]   = useState("");
  const [loaded,    setLoaded]    = useState<string | null>(null);
  const [dragOver,  setDragOver]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-load photos for the first event on mount
  useEffect(() => {
    if (events[0]?.id) loadPhotos(events[0].id);
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

  async function uploadFile(file: File) {
    if (!selectedEventId) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Only JPEG, PNG, or WebP files are accepted.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      alert("File is too large. Maximum 15MB.");
      return;
    }
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    if (caption.trim()) form.append("caption", caption.trim());
    const res = await fetch(`/api/admin/events/${selectedEventId}/photos`, {
      method: "POST",
      body: form,
    });
    if (res.ok) {
      const data = await res.json();
      setPhotos(prev => [...prev, data.photo]);
      setCaption("");
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? "Upload failed");
    }
    setUploading(false);
  }

  async function deletePhoto(photoId: string) {
    if (!confirm("Delete this photo?")) return;
    const res = await fetch(`/api/admin/events/${selectedEventId}/photos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId }),
    });
    if (res.ok) setPhotos(prev => prev.filter(p => p.id !== photoId));
  }

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
                const file = e.dataTransfer.files[0];
                if (file) uploadFile(file);
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }}
              />
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={24} className="animate-spin text-forest/40" />
                  <p className="text-sm text-charcoal/50">Uploading &amp; compressing…</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload size={24} className="text-charcoal/25" />
                  <p className="text-sm font-medium text-charcoal/50">Drop a photo here or click to browse</p>
                  <p className="text-xs text-charcoal/30">JPEG, PNG, or WebP · Max 15MB · Auto-compressed to ~200KB</p>
                </div>
              )}
            </div>
            <input
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Caption (optional)"
              className="w-full px-3 py-2 rounded-xl border border-mist text-sm focus:outline-none focus:border-forest"
            />
          </div>

          {/* Photo grid */}
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {photos.map(photo => (
                <div key={photo.id} className="group relative rounded-2xl overflow-hidden bg-charcoal/5 aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl(photo.path)}
                    alt={photo.caption ?? "Event photo"}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                    {photo.caption && (
                      <p className="text-[10px] text-cream/80 leading-relaxed flex-1 mr-2 line-clamp-2">
                        {photo.caption}
                      </p>
                    )}
                    <button
                      onClick={() => deletePhoto(photo.id)}
                      className="flex-shrink-0 w-7 h-7 rounded-lg bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
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
    </div>
  );
}
