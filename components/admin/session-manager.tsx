"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
import {
  GripVertical, Plus, Trash2, ChevronDown, ChevronUp, X, Check,
  Music2, Loader2, Mic, BookOpen, Heart, Zap, Headphones, Library, Search, MessageSquare, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Song = { id: string; title: string; artist: string | null; lyrics: string | null };
type SessionSong = {
  id: string; sort_order: number; vocalist: string | null;
  item_type: string; item_text: string | null;
  songs: Song | null;
};
type TriviaQuestion = { id: string; question: string; category: string };
type Session = {
  id: string; title: string; type: string;
  duration_min: number | null; notes: string | null;
  sort_order: number; session_songs: SessionSong[];
  trivia_question_id: string | null;
  trivia_questions: TriviaQuestion | null;
};

const TEXT_ITEM_TYPES = [
  { value: "quote",  label: "Quote"  },
  { value: "topic",  label: "Topic"  },
  { value: "verse",  label: "Verse"  },
  { value: "text",   label: "Text"   },
];

const SESSION_TYPES: Array<{ value: string; label: string; icon: React.ElementType; color: string }> = [
  { value: "worship",   label: "Worship",   icon: Music2,     color: "bg-forest/15 text-forest" },
  { value: "prayer",    label: "Prayer",    icon: Heart,      color: "bg-gold/15 text-amber-700" },
  { value: "sharing",   label: "Sharing",   icon: Mic,        color: "bg-blue-50 text-blue-600" },
  { value: "teaching",  label: "Teaching",  icon: BookOpen,   color: "bg-purple-50 text-purple-600" },
  { value: "open_mic",  label: "Open Mic",  icon: Headphones, color: "bg-pink-50 text-pink-600" },
  { value: "other",     label: "Other",     icon: Zap,        color: "bg-charcoal/6 text-charcoal/60" },
];

const SESSION_HINTS: Record<string, { items: string[]; tip: string }> = {
  worship:  { items: ["Add each song from the setlist", "Assign vocalist names so they can filter in the contribute page", "Paste full lyrics so they show live on attendee screens"], tip: "Songs flow top→bottom in the control panel. Add them in set order." },
  prayer:   { items: ["Add a 'Quote' item for each prayer prompt", "Add a 'Verse' item for any scripture anchor", "Leave notes for the prayer leader"], tip: "Use the Custom scene on the control panel to push live prompts to the display screen." },
  sharing:  { items: ["Add a 'Topic' item as the discussion prompt", "Add 'Text' items for sub-questions or talking points", "Set a duration so the session stays on time"], tip: "Switch to the Community scene to show attendance count while sharing." },
  teaching: { items: ["Add 'Verse' items for each scripture reference", "Add 'Text' items for outline points", "Paste full passage text so it appears on the display screen"], tip: "Use the Theme scene on the control panel to anchor the teaching title on screen." },
  open_mic: { items: ["Add songs that participants may request", "Assign vocalist names as people sign up", "Use Trivia between sets to keep energy up"], tip: "Plan a trivia question for this section — it fills wait time well." },
  other:    { items: ["Add songs, quotes, verses, or topics as needed", "Drag to reorder if the plan changes mid-session"], tip: "Any item type can be pushed live from the control panel." },
};

function getTypeInfo(type: string) {
  return SESSION_TYPES.find(t => t.value === type) ?? SESSION_TYPES[SESSION_TYPES.length - 1];
}

interface Props {
  eventId: string;
  initialSessions: Session[];
}

export function SessionManager({ eventId, initialSessions }: Props) {
  const [sessions,        setSessions]        = useState<Session[]>(initialSessions);
  const [expanded,        setExpanded]        = useState<Set<string>>(new Set());
  const [saving,          setSaving]          = useState(false);
  const [addingSession,   setAddingSession]   = useState(false);
  const [newTitle,        setNewTitle]        = useState("");
  const [newType,         setNewType]         = useState("worship");
  const [triviaQuestions, setTriviaQuestions] = useState<TriviaQuestion[]>([]);

  useEffect(() => {
    fetch("/api/admin/trivia")
      .then(r => r.ok ? r.json() : null)
      .then((d: { questions: TriviaQuestion[] } | null) => { if (d?.questions) setTriviaQuestions(d.questions); })
      .catch(() => {});
  }, []);

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
    if (!confirm("Remove this session?")) return;
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

  async function addSong(sessionId: string, title: string, artist: string, lyrics: string, songId?: string) {
    const body = songId ? { songId } : { title, artist, lyrics };
    const res = await fetch(`/api/admin/events/${eventId}/sessions/${sessionId}/songs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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

  async function addTextItem(sessionId: string, item_type: string, item_text: string) {
    const res = await fetch(`/api/admin/events/${eventId}/sessions/${sessionId}/songs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_type, item_text }),
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

  async function updateSongLyrics(sessionId: string, songId: string, lyrics: string) {
    setSessions(prev => prev.map(s =>
      s.id === sessionId
        ? { ...s, session_songs: s.session_songs.map(ss =>
            ss.id === songId && ss.songs ? { ...ss, songs: { ...ss.songs, lyrics } } : ss
          )}
        : s
    ));
    await fetch(`/api/admin/events/${eventId}/sessions/${sessionId}/songs/${songId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lyrics }),
    });
  }

  async function updateVocalist(sessionId: string, sessionSongId: string, vocalist: string) {
    setSessions(prev => prev.map(s =>
      s.id === sessionId
        ? { ...s, session_songs: s.session_songs.map(ss =>
            ss.id === sessionSongId ? { ...ss, vocalist: vocalist || null } : ss
          )}
        : s
    ));
    await fetch(`/api/admin/events/${eventId}/sessions/${sessionId}/songs/${sessionSongId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vocalist: vocalist || null }),
    });
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

  const totalItems = sessions.reduce((n, s) => n + s.session_songs.length, 0);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-sm text-charcoal/50">
            {sessions.length} section{sessions.length !== 1 ? "s" : ""}
            {totalItems > 0 && <> · {totalItems} item{totalItems !== 1 ? "s" : ""}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saving && (
            <span className="flex items-center gap-1.5 text-xs text-charcoal/40">
              <Loader2 size={11} className="animate-spin" /> Saving
            </span>
          )}
          <button
            onClick={() => setAddingSession(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-forest text-cream text-xs font-semibold hover:bg-moss transition-colors"
          >
            <Plus size={13} /> Add section
          </button>
        </div>
      </div>

      {/* Add session inline form */}
      {addingSession && (
        <div className="bg-white rounded-2xl border border-forest/20 p-4 flex-shrink-0">
          <p className="text-xs font-semibold text-forest mb-3">New section</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[11px] font-semibold text-charcoal/60 mb-1.5 uppercase tracking-wider">Title</label>
              <input
                autoFocus
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addSession()}
                className="w-full px-3 py-2 rounded-xl border border-mist text-sm focus:outline-none focus:border-forest transition-colors"
                placeholder="Opening Worship"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-charcoal/60 mb-1.5 uppercase tracking-wider">Type</label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-mist text-sm focus:outline-none focus:border-forest transition-colors"
              >
                {SESSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addSession}
              disabled={!newTitle.trim() || saving}
              className="px-4 py-2 rounded-full bg-forest text-cream text-xs font-semibold disabled:opacity-50"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : "Add"}
            </button>
            <button
              onClick={() => { setAddingSession(false); setNewTitle(""); }}
              className="px-4 py-2 rounded-full border border-mist text-xs text-charcoal/60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sessions list */}
      {sessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-mist p-12 text-center flex-1">
          <div className="w-14 h-14 rounded-2xl bg-forest/6 flex items-center justify-center mx-auto mb-4">
            <Music2 size={22} className="text-forest/40" />
          </div>
          <p className="text-sm font-medium text-charcoal/50 mb-1">No program yet</p>
          <p className="text-xs text-charcoal/30 mb-5">Add sections to build the evening&apos;s program</p>
          <button
            onClick={() => setAddingSession(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-forest text-cream text-sm font-semibold hover:bg-moss transition-colors"
          >
            <Plus size={14} /> Add first section
          </button>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sessions.map(s => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2 pb-4">
                {sessions.map((session, idx) => (
                  <SortableSessionCard
                    key={session.id}
                    session={session}
                    index={idx}
                    expanded={expanded.has(session.id)}
                    allSessions={sessions}
                    triviaQuestions={triviaQuestions}
                    onToggle={() => toggleExpand(session.id)}
                    onUpdate={patch => updateSession(session.id, patch)}
                    onDelete={() => deleteSession(session.id)}
                    onAddSong={(title, artist, lyrics, songId) => addSong(session.id, title, artist, lyrics, songId)}
                    onAddTextItem={(item_type, item_text) => addTextItem(session.id, item_type, item_text)}
                    onRemoveSong={ssId => removeSong(session.id, ssId)}
                    onUpdateLyrics={(songId, lyrics) => updateSongLyrics(session.id, songId, lyrics)}
                    onUpdateVocalist={(ssId, vocalist) => updateVocalist(session.id, ssId, vocalist)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}

interface CardProps {
  session:          Session;
  index:            number;
  expanded:         boolean;
  allSessions:      Session[];
  triviaQuestions:  TriviaQuestion[];
  onToggle:         () => void;
  onUpdate:         (patch: Partial<Session>) => void;
  onDelete:         () => void;
  onAddSong:        (title: string, artist: string, lyrics: string, songId?: string) => Promise<void>;
  onAddTextItem:    (item_type: string, item_text: string) => Promise<void>;
  onRemoveSong:     (ssId: string) => void;
  onUpdateLyrics:   (songId: string, lyrics: string) => void;
  onUpdateVocalist: (ssId: string, vocalist: string) => void;
}

type LibrarySong = { id: string; title: string; artist: string | null; lyrics: string | null };

function SortableSessionCard({
  session, index, expanded, allSessions, triviaQuestions, onToggle, onUpdate, onDelete, onAddSong, onAddTextItem, onRemoveSong, onUpdateLyrics, onUpdateVocalist,
}: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: session.id });
  const [addingSong,      setAddingSong]      = useState(false);
  const [addMode,         setAddMode]         = useState<"new" | "library">("library");
  const [songTitle,       setSongTitle]       = useState("");
  const [songArtist,      setSongArtist]      = useState("");
  const [songLyrics,      setSongLyrics]      = useState("");
  const [expandedSong,    setExpandedSong]    = useState<string | null>(null);
  const [editingSong,     setEditingSong]     = useState<string | null>(null);
  const [addingText,      setAddingText]      = useState(false);
  const [textType,        setTextType]        = useState("quote");
  const [textContent,     setTextContent]     = useState("");
  const [libQuery,        setLibQuery]        = useState("");
  const [libResults,      setLibResults]      = useState<LibrarySong[]>([]);
  const [libLoading,      setLibLoading]      = useState(false);
  const [addingBulk,      setAddingBulk]      = useState(false);
  const [selectedSongs,   setSelectedSongs]   = useState<Set<string>>(new Set());
  // Vocalist inline editing
  const [editingVocalist, setEditingVocalist] = useState<string | null>(null);
  const [savedVocalist,   setSavedVocalist]   = useState<string | null>(null);
  const lyricsRefs   = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const vocalistRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // IDs already in THIS session — used to mark library songs as added
  const addedSongIds = new Set(session.session_songs.map(ss => ss.songs?.id).filter(Boolean) as string[]);

  // Map song ID → section titles it appears in (other sections only)
  const songOtherSections = new Map<string, string[]>();
  for (const sess of allSessions) {
    if (sess.id === session.id) continue;
    for (const ss of sess.session_songs) {
      const sid = ss.songs?.id;
      if (!sid) continue;
      if (!songOtherSections.has(sid)) songOtherSections.set(sid, []);
      songOtherSections.get(sid)!.push(sess.title);
    }
  }

  const searchLib = useCallback(async (q: string) => {
    setLibLoading(true);
    try {
      const res = await fetch(`/api/admin/songs?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setLibResults(data.songs ?? []);
      }
    } finally {
      setLibLoading(false);
    }
  }, []);

  // Auto-load library when panel opens
  useEffect(() => {
    if (addingSong && addMode === "library") searchLib(libQuery);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addingSong]);

  // Debounced search on query change
  useEffect(() => {
    if (addMode !== "library" || !addingSong) return;
    const timer = setTimeout(() => searchLib(libQuery), 250);
    return () => clearTimeout(timer);
  }, [libQuery, addMode, addingSong, searchLib]);

  function toggleLibSong(id: string) {
    setSelectedSongs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function addSelectedFromLibrary() {
    const toAdd = libResults.filter(s => selectedSongs.has(s.id));
    if (!toAdd.length) return;
    setAddingBulk(true);
    for (const song of toAdd) {
      await onAddSong(song.title, song.artist ?? "", song.lyrics ?? "", song.id);
    }
    setAddingBulk(false);
    setSelectedSongs(new Set());
    setAddingSong(false);
    setLibQuery("");
  }

  async function saveVocalist(ssId: string, value: string) {
    if (!value.trim()) { setEditingVocalist(null); return; } // don't save empty
    onUpdateVocalist(ssId, value.trim());
    setEditingVocalist(null);
    setSavedVocalist(ssId);
    setTimeout(() => setSavedVocalist(null), 2000);
  }

  const style = { transform: CSS.Transform.toString(transform), transition };
  const typeInfo = getTypeInfo(session.type);
  const TypeIcon = typeInfo.icon;

  function submitSong() {
    if (!songTitle.trim()) return;
    onAddSong(songTitle, songArtist, songLyrics);
    setSongTitle(""); setSongArtist(""); setSongLyrics(""); setAddingSong(false);
  }

  function handleLyricsBlur(songId: string) {
    const val = lyricsRefs.current[songId]?.value;
    if (val !== undefined) onUpdateLyrics(songId, val);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-2xl overflow-hidden border transition-all duration-150",
        isDragging ? "border-forest/40 shadow-xl scale-[1.01]" : "border-mist shadow-sm"
      )}
    >
      {/* Session header — dark forest */}
      <div className="bg-[#1b3a2a] flex items-center gap-3 px-4 py-3.5">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-cream/20 hover:text-cream/50 transition-colors touch-none flex-shrink-0"
        >
          <GripVertical size={15} />
        </button>

        <span className="w-6 h-6 rounded-full bg-cream/10 flex items-center justify-center text-[10px] font-bold text-cream/60 flex-shrink-0">
          {index + 1}
        </span>

        {/* Editable title */}
        <input
          type="text"
          value={session.title}
          onChange={e => onUpdate({ title: e.target.value })}
          onBlur={e => onUpdate({ title: e.target.value })}
          className="flex-1 min-w-0 bg-transparent text-cream text-sm font-semibold border-none outline-none placeholder:text-cream/30"
          placeholder="Section title"
        />

        {/* Type badge */}
        <span className={cn("hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold flex-shrink-0", typeInfo.color)}>
          <TypeIcon size={10} />
          {typeInfo.label}
        </span>

        {/* Trivia planned badge */}
        {session.trivia_question_id && (
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-700 text-[10px] font-semibold flex-shrink-0">
            <Sparkles size={9} /> Trivia
          </span>
        )}

        {/* Duration */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <input
            type="number"
            value={session.duration_min ?? ""}
            onChange={e => onUpdate({ duration_min: e.target.value ? Number(e.target.value) : null })}
            className="w-10 bg-transparent text-cream/50 text-xs border-none outline-none text-right"
            placeholder="—"
            min="1"
          />
          <span className="text-cream/30 text-[10px]">min</span>
        </div>

        {/* Item count chip */}
        {session.session_songs.length > 0 && (
          <span className="text-[10px] text-cream/40 flex-shrink-0 tabular-nums">
            {session.session_songs.length}
          </span>
        )}

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-cream/40 hover:text-cream hover:bg-cream/10 transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-cream/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="bg-white">
          {/* Program guide hints */}
          {session.session_songs.length === 0 && (() => {
            const hint = SESSION_HINTS[session.type] ?? SESSION_HINTS.other;
            return (
              <div className="mx-4 mt-4 mb-3 rounded-xl bg-forest/5 border border-forest/10 px-3.5 py-3">
                <p className="text-[10px] font-semibold text-forest/60 uppercase tracking-wider mb-2">Program guide · {getTypeInfo(session.type).label}</p>
                <ul className="space-y-1 mb-2">
                  {hint.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-charcoal/55">
                      <span className="text-forest/40 mt-0.5 flex-shrink-0">·</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] text-charcoal/35 italic">{hint.tip}</p>
              </div>
            );
          })()}

          {/* Notes */}
          <div className="px-4 pt-4 pb-3">
            <label className="block text-[11px] font-semibold text-charcoal/55 uppercase tracking-wider mb-1.5">
              Internal notes
            </label>
            <textarea
              value={session.notes ?? ""}
              onChange={e => onUpdate({ notes: e.target.value || null })}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-mist text-sm text-charcoal/70 focus:outline-none focus:border-forest resize-none placeholder:text-charcoal/25"
              placeholder="Notes visible only to admins…"
            />
          </div>

          {/* Trivia planning */}
          <div className="px-4 pb-4">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-charcoal/55 uppercase tracking-wider mb-1.5">
              <Sparkles size={10} className="text-amber-500" /> Planned trivia
            </label>
            {triviaQuestions.length === 0 ? (
              <p className="text-[11px] text-charcoal/35 italic">No trivia questions in library yet</p>
            ) : (
              <select
                value={session.trivia_question_id ?? ""}
                onChange={e => onUpdate({ trivia_question_id: e.target.value || null })}
                className="w-full px-3 py-2 rounded-xl border border-mist text-sm text-charcoal focus:outline-none focus:border-amber-400 bg-white"
              >
                <option value="">No trivia planned</option>
                {triviaQuestions.map(q => (
                  <option key={q.id} value={q.id}>
                    [{q.category}] {q.question.length > 70 ? q.question.slice(0, 70) + "…" : q.question}
                  </option>
                ))}
              </select>
            )}
            {session.trivia_questions && (
              <p className="text-[11px] text-amber-700/70 mt-1.5 truncate">
                Planned: {session.trivia_questions.question}
              </p>
            )}
          </div>

          {/* Songs/items — Spotify-style dark panel */}
          <div className="mx-4 mb-4 rounded-xl overflow-hidden border border-[#1b3a2a]/15">
            {/* Tracks header */}
            <div className="bg-[#1b3a2a]/5 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold text-charcoal/50 w-5 text-center">#</span>
                <span className="text-[11px] font-semibold text-charcoal/50 uppercase tracking-wider">Program items</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setAddingText(true); setAddingSong(false); }}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600/70 hover:text-blue-600 hover:underline"
                >
                  <Plus size={11} /> Add text item
                </button>
                <button
                  onClick={() => { setAddingSong(true); setAddMode("library"); setAddingText(false); }}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-forest hover:underline"
                >
                  <Plus size={11} /> Add song
                </button>
              </div>
            </div>

            {session.session_songs.length === 0 && !addingSong && !addingText ? (
              <div className="px-4 py-6 text-center">
                <Music2 size={18} className="text-charcoal/15 mx-auto mb-1.5" />
                <p className="text-[11px] text-charcoal/35">No items in this section yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1b3a2a]/8">
                {session.session_songs.map((ss, i) => (
                  <div key={ss.id}>
                    {ss.item_type !== "song" ? (
                      <div className="px-4 py-2.5 flex items-center gap-3 group hover:bg-blue-50/40 transition-colors">
                        <span className="text-[11px] text-charcoal/30 w-5 text-center tabular-nums flex-shrink-0">
                          {i + 1}
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <MessageSquare size={12} className="text-blue-500/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-charcoal/80 leading-snug">{ss.item_text}</p>
                          <p className="text-xs text-blue-500/60 capitalize mt-0.5">{ss.item_type}</p>
                        </div>
                        <button
                          onClick={() => onRemoveSong(ss.id)}
                          title="Remove"
                          className="p-1 rounded-lg text-charcoal/20 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div
                          className={cn(
                            "px-4 py-2.5 flex items-center gap-3 group hover:bg-[#1b3a2a]/4 transition-colors cursor-pointer",
                            expandedSong === ss.id && "bg-[#1b3a2a]/6"
                          )}
                          onClick={() => setExpandedSong(expandedSong === ss.id ? null : ss.id)}
                        >
                          <span className="text-[11px] text-charcoal/30 w-5 text-center tabular-nums flex-shrink-0">
                            {i + 1}
                          </span>
                          <div className="w-7 h-7 rounded-lg bg-[#1b3a2a]/8 flex items-center justify-center flex-shrink-0">
                            <Music2 size={12} className="text-forest/60" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-charcoal truncate">{ss.songs?.title}</p>
                            {ss.songs?.artist && (
                              <p className="text-xs text-charcoal/50 truncate mt-0.5">{ss.songs.artist}</p>
                            )}
                            {/* Vocalist row */}
                            <div className="mt-1.5" onClick={e => e.stopPropagation()}>
                              {editingVocalist === ss.id ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    ref={el => { vocalistRefs.current[ss.id] = el; }}
                                    autoFocus
                                    defaultValue={ss.vocalist ?? ""}
                                    placeholder="Vocalist name…"
                                    onKeyDown={e => {
                                      if (e.key === "Enter") saveVocalist(ss.id, (e.target as HTMLInputElement).value.trim());
                                      if (e.key === "Escape") setEditingVocalist(null);
                                    }}
                                    className="text-xs text-forest font-medium bg-forest/8 border border-forest/30 rounded-lg px-2 py-1 outline-none focus:border-forest w-32 placeholder:text-forest/30"
                                  />
                                  <button
                                    onClick={() => saveVocalist(ss.id, vocalistRefs.current[ss.id]?.value ?? "")}
                                    className="p-1 rounded-md bg-forest/10 hover:bg-forest/20 text-forest transition-colors"
                                    title="Save"
                                  >
                                    <Check size={12} />
                                  </button>
                                  <button
                                    onClick={() => setEditingVocalist(null)}
                                    className="p-1 rounded-md bg-charcoal/8 hover:bg-charcoal/15 text-charcoal/50 transition-colors"
                                    title="Cancel"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ) : savedVocalist === ss.id ? (
                                <span className="inline-flex items-center gap-1 text-xs text-green-600 font-semibold">
                                  <Check size={11} /> Saved
                                </span>
                              ) : ss.vocalist ? (
                                <button
                                  onClick={() => setEditingVocalist(ss.id)}
                                  className="inline-flex items-center gap-1.5 text-xs hover:opacity-75 transition-opacity"
                                >
                                  <Mic size={11} className="text-forest/60 flex-shrink-0" />
                                  <span className="font-semibold text-forest">{ss.vocalist}</span>
                                  <span className="font-normal text-charcoal/40">&nbsp;· session vocalist</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setEditingVocalist(ss.id)}
                                  className="inline-flex items-center gap-1.5 text-xs font-medium text-charcoal/40 hover:text-forest transition-colors"
                                >
                                  <Mic size={11} />
                                  Assign vocalist
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingSong(editingSong === ss.id ? null : ss.id); }}
                              className="text-[10px] font-semibold text-forest hover:underline px-2 py-1"
                            >
                              Lyrics
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); onRemoveSong(ss.id); }}
                              title="Remove from this section"
                              className="p-1 rounded-lg text-charcoal/25 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <X size={13} />
                            </button>
                          </div>
                          <ChevronDown
                            size={13}
                            className={cn("text-charcoal/25 transition-transform flex-shrink-0", expandedSong === ss.id && "rotate-180")}
                          />
                        </div>

                        {/* Lyrics panel */}
                        {(expandedSong === ss.id || editingSong === ss.id) && (
                          <div className="bg-[#0f1f15] px-4 py-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[10px] font-semibold text-gold/60 uppercase tracking-wider">{ss.songs?.title}</p>
                              {editingSong === ss.id ? (
                                <button
                                  onClick={() => { handleLyricsBlur(ss.id); setEditingSong(null); }}
                                  className="text-[11px] text-forest/70 hover:text-gold font-semibold"
                                >
                                  Done
                                </button>
                              ) : (
                                <button
                                  onClick={() => setEditingSong(ss.id)}
                                  className="text-[11px] text-cream/30 hover:text-cream transition-colors"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                            {editingSong === ss.id ? (
                              <textarea
                                ref={el => { lyricsRefs.current[ss.id] = el; }}
                                defaultValue={ss.songs?.lyrics ?? ""}
                                rows={10}
                                onBlur={() => handleLyricsBlur(ss.id)}
                                className="w-full bg-transparent text-cream/70 text-sm leading-loose resize-y outline-none placeholder:text-cream/20 font-mono"
                                placeholder={"Verse 1:\n...\n\nChorus:\n..."}
                              />
                            ) : (
                              <pre className="text-cream/55 text-sm leading-loose whitespace-pre-wrap font-sans min-h-[60px]">
                                {ss.songs?.lyrics || <span className="text-cream/20 italic text-xs">No lyrics yet — click Edit to add</span>}
                              </pre>
                            )}
                            <p className="text-[10px] text-cream/20 mt-3">
                              Separate verses/sections with a blank line. The display screen advances one section at a time.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add text item inline form */}
            {addingText && (
              <div className="border-t border-[#1b3a2a]/15 bg-blue-50/40 px-4 py-3 space-y-2">
                <p className="text-[10px] font-semibold text-blue-600/70 uppercase tracking-wider">Add text item</p>
                <div className="flex gap-2">
                  {TEXT_ITEM_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setTextType(t.value)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium transition-all",
                        textType === t.value ? "bg-blue-600 text-white" : "bg-white border border-blue-200 text-blue-500/70 hover:border-blue-400"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <textarea
                  autoFocus
                  value={textContent}
                  onChange={e => setTextContent(e.target.value)}
                  rows={3}
                  placeholder={
                    textType === "quote"  ? `e.g. "Where there is love, there is life." — Gandhi` :
                    textType === "topic"  ? "e.g. What does forgiveness look like in daily life?" :
                    textType === "verse"  ? "e.g. John 3:16 — For God so loved the world…" :
                    "Enter the text to display…"
                  }
                  className="w-full px-3 py-2 rounded-xl border border-blue-200 text-sm text-charcoal focus:outline-none focus:border-blue-400 resize-none placeholder:text-charcoal/30"
                />
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!textContent.trim()) return;
                      await onAddTextItem(textType, textContent.trim());
                      setTextContent(""); setAddingText(false);
                    }}
                    disabled={!textContent.trim()}
                    className="px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-semibold disabled:opacity-50"
                  >
                    Add {textType}
                  </button>
                  <button
                    onClick={() => { setAddingText(false); setTextContent(""); }}
                    className="px-4 py-2 rounded-full border border-mist text-xs text-charcoal/60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Add song inline form */}
            {addingSong && (
              <div className="border-t border-[#1b3a2a]/15 bg-off-white px-4 py-3 space-y-2">
                {/* Mode toggle */}
                <div className="flex items-center gap-1 bg-white rounded-xl border border-mist p-1 w-fit">
                  <button
                    onClick={() => setAddMode("new")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all",
                      addMode === "new" ? "bg-forest text-cream" : "text-charcoal/50 hover:text-charcoal"
                    )}
                  >
                    <Plus size={10} /> New song
                  </button>
                  <button
                    onClick={() => { setAddMode("library"); if (!libResults.length) searchLib(""); }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all",
                      addMode === "library" ? "bg-forest text-cream" : "text-charcoal/50 hover:text-charcoal"
                    )}
                  >
                    <Library size={10} /> From library
                  </button>
                </div>

                {addMode === "new" ? (
                  <>
                    <div className="grid sm:grid-cols-2 gap-2">
                      <input
                        autoFocus
                        value={songTitle}
                        onChange={e => setSongTitle(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && submitSong()}
                        placeholder="Song title *"
                        className="w-full px-3 py-2 rounded-xl border border-mist text-sm focus:outline-none focus:border-forest"
                      />
                      <input
                        value={songArtist}
                        onChange={e => setSongArtist(e.target.value)}
                        placeholder="Artist / songwriter"
                        className="w-full px-3 py-2 rounded-xl border border-mist text-sm focus:outline-none focus:border-forest"
                      />
                    </div>
                    <textarea
                      value={songLyrics}
                      onChange={e => setSongLyrics(e.target.value)}
                      placeholder={"Verse 1:\n...\n\nChorus:\n..."}
                      rows={5}
                      className="w-full px-3 py-2 rounded-xl border border-mist text-sm font-mono focus:outline-none focus:border-forest resize-y placeholder:text-charcoal/25"
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={submitSong}
                        disabled={!songTitle.trim()}
                        className="px-4 py-2 rounded-full bg-forest text-cream text-xs font-semibold disabled:opacity-50"
                      >
                        Add song
                      </button>
                      <button
                        onClick={() => { setAddingSong(false); setSongTitle(""); setSongArtist(""); setSongLyrics(""); }}
                        className="px-4 py-2 rounded-full border border-mist text-xs text-charcoal/60"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" />
                      <input
                        autoFocus
                        value={libQuery}
                        onChange={e => setLibQuery(e.target.value)}
                        placeholder="Search songs…"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-mist text-sm focus:outline-none focus:border-forest"
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto rounded-xl border border-mist bg-white divide-y divide-mist">
                      {libLoading ? (
                        <div className="py-6 text-center">
                          <Loader2 size={14} className="animate-spin text-charcoal/30 mx-auto" />
                        </div>
                      ) : libResults.length === 0 ? (
                        <div className="py-5 text-center text-xs text-charcoal/35">
                          {libQuery ? "No songs found" : "No songs in library yet"}
                        </div>
                      ) : libResults.map(song => {
                        const alreadyAdded   = addedSongIds.has(song.id);
                        const isSelected     = selectedSongs.has(song.id);
                        const otherSections  = songOtherSections.get(song.id) ?? [];
                        return (
                          <button
                            key={song.id}
                            onClick={() => { if (!alreadyAdded) toggleLibSong(song.id); }}
                            disabled={alreadyAdded || addingBulk}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left",
                              alreadyAdded ? "opacity-40 cursor-not-allowed" : isSelected ? "bg-forest/8 hover:bg-forest/12" : "hover:bg-forest/4"
                            )}
                          >
                            {/* Checkbox */}
                            <div className={cn(
                              "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all",
                              alreadyAdded ? "border-charcoal/20 bg-charcoal/8"
                                : isSelected ? "border-forest bg-forest" : "border-charcoal/25"
                            )}>
                              {alreadyAdded
                                ? <span className="text-[8px] text-charcoal/40">✓</span>
                                : isSelected && <span className="text-[8px] text-cream font-bold">✓</span>
                              }
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-charcoal truncate">{song.title}</p>
                              {song.artist && <p className="text-xs text-charcoal/55 truncate">{song.artist}</p>}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                              {alreadyAdded && (
                                <span className="text-[11px] text-charcoal/40">in this section</span>
                              )}
                              {otherSections.slice(0, 2).map(name => (
                                <span key={name} className="text-[10px] bg-gold/12 text-amber-700 px-1.5 py-0.5 rounded-full max-w-[80px] truncate">
                                  {name}
                                </span>
                              ))}
                              {otherSections.length > 2 && (
                                <span className="text-[11px] text-charcoal/40">+{otherSections.length - 2}</span>
                              )}
                              {!alreadyAdded && otherSections.length === 0 && song.lyrics && (
                                <span className="text-[11px] text-charcoal/35">lyrics</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      {selectedSongs.size > 0 ? (
                        <button
                          onClick={addSelectedFromLibrary}
                          disabled={addingBulk}
                          className="flex items-center gap-2 px-4 py-2 rounded-full bg-forest text-cream text-xs font-semibold disabled:opacity-60"
                        >
                          {addingBulk
                            ? <><Loader2 size={11} className="animate-spin" /> Adding…</>
                            : <>Add {selectedSongs.size} song{selectedSongs.size > 1 ? "s" : ""}</>
                          }
                        </button>
                      ) : null}
                      <button
                        onClick={() => { setAddingSong(false); setLibQuery(""); setLibResults([]); setSelectedSongs(new Set()); }}
                        className="px-4 py-2 rounded-full border border-mist text-xs text-charcoal/60"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
