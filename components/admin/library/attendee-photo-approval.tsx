"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Eye, EyeOff, Trash2, Loader2, Camera, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Event {
  id:         string;
  title:      string;
  event_date: string;
}

interface Photo {
  id:           string;
  storage_path: string;
  signed_url:   string | null;
  caption:      string | null;
  submitted_by: string | null;
  file_size_kb: number | null;
  is_approved:  boolean;
  show_on_site: boolean;
  created_at:   string;
}

interface Props {
  events: Event[];
}

export function AttendeePhotoApproval({ events }: Props) {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? "");
  const [photos,  setPhotos]  = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded,  setLoaded]  = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, boolean>>({});

  // Auto-load on mount and whenever the selected event changes
  useEffect(() => {
    if (selectedEventId) loadPhotos(selectedEventId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId]);

  async function loadPhotos(eventId: string) {
    if (!eventId) return;
    setLoading(true);
    setPhotos([]);
    setLoaded(eventId);
    const res = await fetch(`/api/admin/events/${eventId}/attendee-photos`);
    if (res.ok) {
      const data = await res.json();
      setPhotos(data.photos ?? []);
    }
    setLoading(false);
  }

  async function patch(photoId: string, fields: { is_approved?: boolean; show_on_site?: boolean }) {
    setPending(p => ({ ...p, [photoId]: true }));
    const res = await fetch(`/api/admin/events/${selectedEventId}/attendee-photos`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId, ...fields }),
    });
    if (res.ok) {
      setPhotos(prev => prev.map(p =>
        p.id === photoId ? { ...p, ...fields } : p
      ));
    }
    setPending(p => { const n = { ...p }; delete n[photoId]; return n; });
  }

  async function deletePhoto(photoId: string) {
    if (!confirm("Delete this photo permanently?")) return;
    setPending(p => ({ ...p, [photoId]: true }));
    const res = await fetch(`/api/admin/events/${selectedEventId}/attendee-photos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId }),
    });
    if (res.ok) setPhotos(prev => prev.filter(p => p.id !== photoId));
    setPending(p => { const n = { ...p }; delete n[photoId]; return n; });
  }

  const pending_photos  = photos.filter(p => !p.is_approved);
  const approved_photos = photos.filter(p => p.is_approved);

  return (
    <div className="flex flex-col gap-4">
      {/* Event selector */}
      <div className="bg-white rounded-2xl border border-mist p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div className="flex-1 min-w-0">
          <label className="block text-[10px] font-semibold text-charcoal/50 uppercase tracking-wider mb-1.5">
            Select event
          </label>
          <select
            value={selectedEventId}
            onChange={e => {
              setSelectedEventId(e.target.value);
              setLoaded(null);
            }}
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
        <button
          onClick={() => loadPhotos(selectedEventId)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-forest text-cream text-sm font-medium hover:bg-moss transition-colors flex-shrink-0 disabled:opacity-50"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          {loaded === selectedEventId ? "Refresh" : "Load photos"}
        </button>
      </div>

      {loaded === selectedEventId && (
        <>
          {photos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-mist p-12 flex flex-col items-center gap-3 text-center">
              <Camera size={26} className="text-charcoal/15" />
              <p className="text-sm text-charcoal/40">No attendee photos submitted yet</p>
            </div>
          ) : (
            <>
              {/* Pending approval */}
              {pending_photos.length > 0 && (
                <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-amber-100 bg-amber-50/50 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <p className="text-sm font-semibold text-amber-700">
                      Pending review — {pending_photos.length} photo{pending_photos.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
                    {pending_photos.map(photo => (
                      <PhotoCard
                        key={photo.id}
                        photo={photo}
                        busy={!!pending[photo.id]}
                        onApprove={() => patch(photo.id, { is_approved: true })}
                        onReject={() => deletePhoto(photo.id)}
                        onToggleVisible={() => patch(photo.id, { show_on_site: !photo.show_on_site })}
                        onDelete={() => deletePhoto(photo.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Approved */}
              {approved_photos.length > 0 && (
                <div className="bg-white rounded-2xl border border-mist overflow-hidden">
                  <div className="px-5 py-3 border-b border-mist flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-green-500" />
                    <p className="text-sm font-semibold text-charcoal/60">
                      Approved — {approved_photos.length} photo{approved_photos.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
                    {approved_photos.map(photo => (
                      <PhotoCard
                        key={photo.id}
                        photo={photo}
                        busy={!!pending[photo.id]}
                        onApprove={() => patch(photo.id, { is_approved: false })}
                        approveLabel="Unapprove"
                        onToggleVisible={() => patch(photo.id, { show_on_site: !photo.show_on_site })}
                        onDelete={() => deletePhoto(photo.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function PhotoCard({
  photo,
  busy,
  onApprove,
  approveLabel = "Approve",
  onReject,
  onToggleVisible,
  onDelete,
}: {
  photo:            Photo;
  busy:             boolean;
  onApprove:        () => void;
  approveLabel?:    string;
  onReject?:        () => void;
  onToggleVisible:  () => void;
  onDelete:         () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {/* Image */}
      <div className="relative rounded-2xl overflow-hidden bg-charcoal/5 aspect-square">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {photo.signed_url ? (
          <img
            src={photo.signed_url}
            alt={photo.caption ?? "Attendee photo"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera size={24} className="text-charcoal/20" />
          </div>
        )}
        {photo.is_approved && (
          <div className={cn(
            "absolute top-2 right-2 text-[9px] font-semibold px-1.5 py-0.5 rounded-full",
            photo.show_on_site
              ? "bg-green-500 text-white"
              : "bg-charcoal/60 text-white/80"
          )}>
            {photo.show_on_site ? "visible" : "hidden"}
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-forest" />
          </div>
        )}
      </div>

      {/* Meta */}
      {(photo.caption || photo.submitted_by) && (
        <div className="px-0.5">
          {photo.submitted_by && (
            <p className="text-[10px] font-semibold text-charcoal/60 truncate">{photo.submitted_by}</p>
          )}
          {photo.caption && (
            <p className="text-[10px] text-charcoal/40 truncate">{photo.caption}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onApprove}
          disabled={busy}
          className={cn(
            "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold transition-colors disabled:opacity-50",
            photo.is_approved
              ? "bg-charcoal/8 text-charcoal/50 hover:bg-charcoal/12"
              : "bg-green-50 text-green-700 hover:bg-green-100"
          )}
        >
          <CheckCircle2 size={11} />
          {approveLabel}
        </button>

        {!photo.is_approved && onReject && (
          <button
            onClick={onReject}
            disabled={busy}
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-[10px] font-semibold transition-colors disabled:opacity-50"
          >
            <XCircle size={11} />
            Reject
          </button>
        )}

        {photo.is_approved && (
          <button
            onClick={onToggleVisible}
            disabled={busy}
            title={photo.show_on_site ? "Hide from site" : "Show on site"}
            className="flex items-center justify-center py-1.5 px-2 rounded-lg bg-charcoal/6 text-charcoal/50 hover:bg-charcoal/12 transition-colors disabled:opacity-50"
          >
            {photo.show_on_site ? <EyeOff size={11} /> : <Eye size={11} />}
          </button>
        )}

        <button
          onClick={onDelete}
          disabled={busy}
          className="flex items-center justify-center py-1.5 px-2 rounded-lg bg-red-50/70 text-red-400 hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}
