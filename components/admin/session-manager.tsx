"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, ChevronDown, ChevronUp, Music, Loader2 } from "lucide-react";

type Song = { id: string; title: string; artist: string | null; lyrics: string | null };
type SessionSong = { id: string; sort_order: number; songs: Song };
type Session = {
  id: string;
  title: string;
  type: string;
  duration_min: number | null;
  notes: string | null;
  sort_order: number;
  session_songs: SessionSong[];
};

const SESSION_TYPES = [
  { value: "worship",   label: "Worship" },
  { value: "prayer",    label: "Prayer" },
  { value: "sharing",   label: "Sharing" },
  { value: "teaching",  label: "Teaching" },
  { value: "open_mic",  label: "Open Mic" },
  { value: "other",     label: "Other" },
];

interface Props {
  eventId: string;
  initialSessions: Session[];
}

export function SessionManager({ eventId, initialSessions }: Props) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [saving, setSaving]     = useState(false);
  const [addingSession, setAddingSession] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType,  setNewType]  = useState("worship");

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sessions.findIndex(s => s.id === active.id);
    const newIndex = sessions.findIndex(s => s.id === over.id);
    const reordered = arrayMove(sessions, oldIndex, newIndex).map((s, i) => ({ ...s, sort_order: i }));
    setSessions(reordered);
    saveOrder(reordered);
  }

  async function saveOrder(reordered: Session[]) {
    setSaving(true);
    await fetch(`/api/admin/events/${eventId}/sessions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reorder: reordered.map(s => ({ id: s.id, sort_order: s.sort_order })) }),
    });
    setSaving(false);
  }

  async function addSession() {
    if (!newTitle.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/admin/events/${eventId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, type: newType, sort_order: sessions.length }),
    });
    if (res.ok) {
      const data = await res.json();
      setSessions(prev => [...prev, { ...data.session, session_songs: [] }]);
      setNewTitle(""); setAddingSession(false);
    }
    setSaving(false);
  }

  async function deleteSession(id: string) {
    if (!confirm("Delete this session?")) return;
    await fetch(`/api/admin/events/${eventId}/sessions/${id}`, { method: "DELETE" });
    setSessions(prev => prev.filter(s => s.id !== id));
  }

  async function updateSession(id: string, patch: Partial<Session>) {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
    await fetch(`/api/admin/events/${eventId}/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function addSong(sessionId: string, title: string, artist: string, lyrics: string) {
    const res = await fetch(`/api/admin/events/${eventId}/sessions/${sessionId}/songs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, artist, lyrics }),
    });
    if (res.ok) {
      const data = await res.json();
      setSessions(prev => prev.map(s =>
        s.id === sessionId
          ? { ...s, session_songs: [...s.session_songs, data.sessionSong] }
          : s
      ));
    }
  }

  async function removeSong(sessionId: string, sessionSongId: string) {
    await fetch(`/api/admin/events/${eventId}/sessions/${sessionId}/songs/${sessionSongId}`, { method: "DELETE" });
    setSessions(prev => prev.map(s =>
      s.id === sessionId
        ? { ...s, session_songs: s.session_songs.filter(ss => ss.id !== sessionSongId) }
        : s
    ));
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  return (
    <div>
      {/* Header actions */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-charcoal/50">{sessions.length} session{sessions.length !== 1 ? "s" : ""}</span>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="flex items-center gap-1.5 text-xs text-charcoal/40">
              <Loader2 size={12} className="animate-spin" /> Saving…
            </span>
          )}
          <button
            onClick={() => setAddingSession(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest text-cream text-sm font-medium hover:bg-moss transition-colors"
          >
            <Plus size={15} />
            Add session
          </button>
        </div>
      </div>

      {/* New session form */}
      {addingSession && (
        <div className="bg-white rounded-2xl border border-forest/20 p-4 mb-4">
          <h3 className="text-sm font-semibold text-forest mb-3">New session</h3>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-charcoal/60 mb-1">Title *</label>
              <input
                autoFocus
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addSession()}
                className="w-full px-3 py-2 rounded-lg border border-mist text-sm focus:outline-none focus:border-forest"
                placeholder="Opening Worship"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal/60 mb-1">Type</label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-mist text-sm focus:outline-none focus:border-forest"
              >
                {SESSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addSession}
              disabled={!newTitle.trim() || saving}
              className="px-4 py-2 rounded-xl bg-forest text-cream text-sm font-medium disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => { setAddingSession(false); setNewTitle(""); }}
              className="px-4 py-2 rounded-xl border border-mist text-sm text-charcoal/60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-mist p-12 text-center">
          <Music size={24} className="mx-auto text-charcoal/20 mb-3" />
          <p className="text-sm text-charcoal/50 mb-1">No sessions yet</p>
          <p className="text-xs text-charcoal/30">Add sessions to build the order of service</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sessions.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {sessions.map((session, idx) => (
                <SortableSessionRow
                  key={session.id}
                  session={session}
                  index={idx}
                  expanded={expanded.has(session.id)}
                  onToggle={() => toggleExpand(session.id)}
                  onUpdate={patch => updateSession(session.id, patch)}
                  onDelete={() => deleteSession(session.id)}
                  onAddSong={(title, artist, lyrics) => addSong(session.id, title, artist, lyrics)}
                  onRemoveSong={(ssId) => removeSong(session.id, ssId)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

interface RowProps {
  session: Session;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<Session>) => void;
  onDelete: () => void;
  onAddSong: (title: string, artist: string, lyrics: string) => void;
  onRemoveSong: (ssId: string) => void;
}

function SortableSessionRow({ session, index, expanded, onToggle, onUpdate, onDelete, onAddSong, onRemoveSong }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: session.id });
  const [addingSong, setAddingSong] = useState(false);
  const [songTitle, setSongTitle]   = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [songLyrics, setSongLyrics] = useState("");
  const [editingLyrics, setEditingLyrics] = useState<string | null>(null);

  const style = { transform: CSS.Transform.toString(transform), transition };

  function submitSong() {
    if (!songTitle.trim()) return;
    onAddSong(songTitle, songArtist, songLyrics);
    setSongTitle(""); setSongArtist(""); setSongLyrics(""); setAddingSong(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-2xl border transition-shadow ${isDragging ? "border-forest/40 shadow-lg" : "border-mist"}`}
    >
      {/* Row header */}
      <div className="flex items-center gap-3 p-4">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-charcoal/20 hover:text-charcoal/50 transition-colors touch-none"
        >
          <GripVertical size={16} />
        </button>

        <span className="w-6 h-6 rounded-full bg-forest/8 flex items-center justify-center text-xs font-semibold text-forest flex-shrink-0">
          {index + 1}
        </span>

        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={session.title}
            onChange={e => onUpdate({ title: e.target.value })}
            onBlur={e => onUpdate({ title: e.target.value })}
            className="text-sm font-medium text-forest bg-transparent border-none outline-none w-full"
          />
          <div className="flex items-center gap-3 mt-0.5">
            <select
              value={session.type}
              onChange={e => onUpdate({ type: e.target.value })}
              className="text-xs text-charcoal/50 bg-transparent border-none outline-none"
            >
              {SESSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <span className="text-charcoal/20">·</span>
            <input
              type="number"
              value={session.duration_min ?? ""}
              onChange={e => onUpdate({ duration_min: e.target.value ? Number(e.target.value) : null })}
              className="text-xs text-charcoal/50 bg-transparent border-none outline-none w-12"
              placeholder="min"
            />
            {session.session_songs.length > 0 && (
              <>
                <span className="text-charcoal/20">·</span>
                <span className="text-xs text-charcoal/40 flex items-center gap-1">
                  <Music size={10} /> {session.session_songs.length} song{session.session_songs.length !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-charcoal/30 hover:text-forest hover:bg-forest/5 transition-colors"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-charcoal/20 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-mist px-4 pb-4 pt-3 space-y-4">
          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-charcoal/50 mb-1">Notes (internal)</label>
            <textarea
              value={session.notes ?? ""}
              onChange={e => onUpdate({ notes: e.target.value || null })}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-mist text-sm text-charcoal/70 focus:outline-none focus:border-forest resize-none"
              placeholder="Add notes visible only to admins…"
            />
          </div>

          {/* Songs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-charcoal/50">Songs</label>
              <button
                onClick={() => setAddingSong(true)}
                className="text-xs text-forest hover:underline flex items-center gap-1"
              >
                <Plus size={11} /> Add song
              </button>
            </div>

            {session.session_songs.length > 0 && (
              <div className="space-y-2 mb-3">
                {session.session_songs.map(ss => (
                  <div key={ss.id} className="bg-off-white rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-forest truncate">{ss.songs.title}</p>
                        {ss.songs.artist && <p className="text-xs text-charcoal/50">{ss.songs.artist}</p>}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => setEditingLyrics(editingLyrics === ss.id ? null : ss.id)}
                          className="text-xs text-charcoal/40 hover:text-forest px-2 py-1 rounded-lg hover:bg-forest/5 transition-colors"
                        >
                          {editingLyrics === ss.id ? "Close" : "Lyrics"}
                        </button>
                        <button
                          onClick={() => onRemoveSong(ss.id)}
                          className="p-1 rounded-lg text-charcoal/20 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    {editingLyrics === ss.id && (
                      <textarea
                        defaultValue={ss.songs.lyrics ?? ""}
                        rows={8}
                        className="mt-2 w-full px-3 py-2 rounded-lg border border-mist text-xs font-mono text-charcoal/70 focus:outline-none focus:border-forest resize-y"
                        placeholder="Paste lyrics here…"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {addingSong && (
              <div className="bg-off-white rounded-xl p-3 space-y-2">
                <input
                  autoFocus
                  type="text"
                  value={songTitle}
                  onChange={e => setSongTitle(e.target.value)}
                  placeholder="Song title *"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-mist text-sm focus:outline-none focus:border-forest"
                />
                <input
                  type="text"
                  value={songArtist}
                  onChange={e => setSongArtist(e.target.value)}
                  placeholder="Artist / songwriter"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-mist text-sm focus:outline-none focus:border-forest"
                />
                <textarea
                  value={songLyrics}
                  onChange={e => setSongLyrics(e.target.value)}
                  placeholder="Lyrics (optional)"
                  rows={5}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-mist text-sm font-mono focus:outline-none focus:border-forest resize-y"
                />
                <div className="flex gap-2">
                  <button
                    onClick={submitSong}
                    disabled={!songTitle.trim()}
                    className="px-3 py-1.5 rounded-xl bg-forest text-cream text-xs font-medium disabled:opacity-50"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setAddingSong(false); setSongTitle(""); setSongArtist(""); setSongLyrics(""); }}
                    className="px-3 py-1.5 rounded-xl border border-mist text-xs text-charcoal/60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
