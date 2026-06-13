"use client";

import { useState, useMemo } from "react";
import { Music2, Search, Trash2, Edit2, Check, X, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm-dialog";

const KEYS = ["C","C#/Db","D","D#/Eb","E","F","F#/Gb","G","G#/Ab","A","A#/Bb","B"];
const MODES = ["", "m"]; // major (no suffix) and minor (m)
const KEY_OPTIONS = ["", ...KEYS.flatMap(k => MODES.map(m => k + m))];

type Song = {
  id:         string;
  title:      string;
  artist:     string | null;
  lyrics:     string | null;
  key:        string | null;
  created_at: string;
};

interface Props {
  initialSongs: Song[];
}

const PALETTE = [
  { bg: "#1b3a2a", fg: "#c9a24a" },
  { bg: "#2d5240", fg: "#e4c97e" },
  { bg: "#4e7a5e", fg: "#f7f2e8" },
  { bg: "#c9a24a", fg: "#1b3a2a" },
  { bg: "#0d1a12", fg: "#c9a24a" },
  { bg: "#5c4a35", fg: "#f7f2e8" },
];
function songColor(id: string) {
  let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}
function initials(title: string) {
  return title.trim().slice(0, 2).toUpperCase();
}

export function SongsLibrary({ initialSongs }: Props) {
  const confirm = useConfirm();
  const [songs,    setSongs]    = useState<Song[]>(initialSongs);
  const [query,    setQuery]    = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [editing,  setEditing]  = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Song>>({});
  const [saving,   setSaving]   = useState(false);
  const [adding,   setAdding]   = useState(false);
  const [newSong,  setNewSong]  = useState({ title: "", artist: "", lyrics: "", key: "" });

  const filtered = useMemo(() =>
    songs.filter(s =>
      !query || `${s.title} ${s.artist ?? ""}`.toLowerCase().includes(query.toLowerCase())
    ), [songs, query]);

  function startEdit(song: Song) {
    setEditing(song.id);
    setEditData({ title: song.title, artist: song.artist, lyrics: song.lyrics, key: song.key });
    setSelected(song.id);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    const res = await fetch("/api/admin/songs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...editData }),
    });
    if (res.ok) {
      setSongs(prev => prev.map(s => s.id === id ? { ...s, ...editData } : s));
      setEditing(null);
    }
    setSaving(false);
  }

  async function deleteSong(id: string) {
    const ok = await confirm({ message: "This song will be removed from the library.", destructive: true }); if (!ok) return;
    const res = await fetch("/api/admin/songs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setSongs(prev => prev.filter(s => s.id !== id));
      if (selected === id) setSelected(null);
    }
  }

  async function addSong() {
    if (!newSong.title.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/songs/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSong),
    });
    if (res.ok) {
      const { song } = await res.json();
      setSongs(prev => [song, ...prev]);
      setNewSong({ title: "", artist: "", lyrics: "", key: "" });
      setAdding(false);
    }
    setSaving(false);
  }

  const activeSong = selected ? songs.find(s => s.id === selected) : null;

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[600px]">

      {/* Left — song list */}
      <div className="flex flex-col gap-3 lg:w-80 flex-shrink-0">
        {/* Search + add */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search songs…"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-mist bg-white text-sm focus:outline-none focus:border-forest"
            />
          </div>
          <button
            onClick={() => setAdding(a => !a)}
            className={cn(
              "px-3 py-2 rounded-xl border text-sm font-medium transition-all flex items-center gap-1.5",
              adding ? "bg-forest text-cream border-forest" : "bg-white border-mist text-charcoal/50 hover:text-forest hover:border-forest/30"
            )}
          >
            <Plus size={13} /> Add
          </button>
        </div>

        {/* Add song form */}
        {adding && (
          <div className="bg-white rounded-2xl border border-forest/20 p-4 space-y-2">
            <p className="text-xs font-semibold text-forest">New song</p>
            <input
              autoFocus
              placeholder="Title *"
              value={newSong.title}
              onChange={e => setNewSong(p => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-mist text-sm focus:outline-none focus:border-forest"
            />
            <input
              placeholder="Artist / songwriter"
              value={newSong.artist}
              onChange={e => setNewSong(p => ({ ...p, artist: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-mist text-sm focus:outline-none focus:border-forest"
            />
            <div className="flex items-center gap-2">
              <label className="text-xs text-charcoal/50 w-12 flex-shrink-0">Key</label>
              <select
                value={newSong.key}
                onChange={e => setNewSong(p => ({ ...p, key: e.target.value }))}
                className="flex-1 px-3 py-2 rounded-xl border border-mist text-sm focus:outline-none focus:border-forest bg-white"
              >
                {KEY_OPTIONS.map(k => (
                  <option key={k} value={k}>{k || "— no key —"}</option>
                ))}
              </select>
            </div>
            <textarea
              placeholder={"Verse 1:\n...\n\nChorus:\n..."}
              value={newSong.lyrics}
              onChange={e => setNewSong(p => ({ ...p, lyrics: e.target.value }))}
              rows={5}
              className="w-full px-3 py-2 rounded-xl border border-mist text-sm font-mono focus:outline-none focus:border-forest resize-none placeholder:text-charcoal/25"
            />
            <div className="flex gap-2">
              <button
                onClick={addSong}
                disabled={!newSong.title.trim() || saving}
                className="px-4 py-2 rounded-full bg-forest text-cream text-xs font-semibold disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setAdding(false)}
                className="px-4 py-2 rounded-full border border-mist text-xs text-charcoal/60"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Song rows */}
        <div className="bg-white rounded-2xl border border-mist overflow-hidden flex-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Music2 size={22} className="text-charcoal/15 mb-3" />
              <p className="text-sm text-charcoal/40">{query ? "No songs found" : "No songs yet"}</p>
              <p className="text-xs text-charcoal/25 mt-1">Songs are added when you build event programs</p>
            </div>
          ) : (
            <div className="divide-y divide-mist max-h-[520px] overflow-y-auto">
              {filtered.map(song => {
                const color = songColor(song.id);
                const isActive = selected === song.id;
                return (
                  <button
                    key={song.id}
                    onClick={() => setSelected(isActive ? null : song.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 hover:bg-charcoal/3 transition-colors text-left",
                      isActive && "bg-forest/5 border-l-2 border-forest"
                    )}
                  >
                    {/* Album art placeholder */}
                    <div
                      className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold"
                      style={{ background: color.bg, color: color.fg }}
                    >
                      {initials(song.title)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm font-medium truncate", isActive ? "text-forest" : "text-charcoal")}>
                          {song.title}
                        </p>
                        {song.key && (
                          <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gold/15 text-gold/80 border border-gold/20">
                            {song.key}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-charcoal/40 truncate mt-0.5">
                        {song.artist ?? <span className="italic">Unknown artist</span>}
                        {song.lyrics && <span className="text-charcoal/25"> · has lyrics</span>}
                      </p>
                    </div>
                    {isActive && <ChevronDown size={14} className="text-forest/50 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
          <div className="px-4 py-2 border-t border-mist bg-off-white">
            <p className="text-[10px] text-charcoal/35">{filtered.length} song{filtered.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      {/* Right — song detail / editor */}
      <div className="flex-1 min-w-0">
        {!activeSong ? (
          <div className="h-full min-h-[300px] bg-white rounded-2xl border border-mist flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-3xl bg-forest/6 flex items-center justify-center mb-4">
              <Music2 size={26} className="text-forest/30" />
            </div>
            <p className="text-sm font-medium text-charcoal/40">Select a song</p>
            <p className="text-xs text-charcoal/25 mt-1">View or edit lyrics, title, and artist</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-mist overflow-hidden">
            {/* Song header */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-mist">
              <div
                className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl font-bold"
                style={{ background: songColor(activeSong.id).bg, color: songColor(activeSong.id).fg }}
              >
                {initials(activeSong.title)}
              </div>
              <div className="flex-1 min-w-0">
                {editing === activeSong.id ? (
                  <div className="space-y-2">
                    <input
                      value={editData.title ?? ""}
                      onChange={e => setEditData(p => ({ ...p, title: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl border border-mist text-base font-semibold focus:outline-none focus:border-forest"
                    />
                    <input
                      value={editData.artist ?? ""}
                      onChange={e => setEditData(p => ({ ...p, artist: e.target.value || null }))}
                      placeholder="Artist / songwriter"
                      className="w-full px-3 py-1.5 rounded-xl border border-mist text-sm focus:outline-none focus:border-forest"
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-charcoal/50 w-12 flex-shrink-0">Key</label>
                      <select
                        value={editData.key ?? ""}
                        onChange={e => setEditData(p => ({ ...p, key: e.target.value || null }))}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-mist text-sm focus:outline-none focus:border-forest bg-white"
                      >
                        {KEY_OPTIONS.map(k => (
                          <option key={k} value={k}>{k || "— no key —"}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold text-charcoal truncate">{activeSong.title}</h2>
                      {activeSong.key && (
                        <span className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-lg bg-gold/15 text-gold/80 border border-gold/20">
                          {activeSong.key}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-charcoal/50 mt-0.5">{activeSong.artist ?? <span className="italic">Unknown artist</span>}</p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {editing === activeSong.id ? (
                  <>
                    <button
                      onClick={() => saveEdit(activeSong.id)}
                      disabled={saving}
                      className="p-2 rounded-xl bg-forest text-cream hover:bg-moss transition-colors"
                      title="Save"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="p-2 rounded-xl bg-charcoal/5 text-charcoal/50 hover:bg-charcoal/10 transition-colors"
                      title="Cancel"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(activeSong)}
                      className="p-2 rounded-xl text-charcoal/40 hover:text-forest hover:bg-forest/8 transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => deleteSong(activeSong.id)}
                      className="p-2 rounded-xl text-charcoal/30 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Lyrics */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold text-charcoal/40 uppercase tracking-wider">Lyrics</p>
                {!editing && activeSong.lyrics && (
                  <span className="text-[10px] text-charcoal/25">
                    {activeSong.lyrics.split(/\n{2,}/).filter(Boolean).length} section{activeSong.lyrics.split(/\n{2,}/).filter(Boolean).length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {editing === activeSong.id ? (
                <textarea
                  value={editData.lyrics ?? ""}
                  onChange={e => setEditData(p => ({ ...p, lyrics: e.target.value || null }))}
                  rows={18}
                  placeholder={"Verse 1:\n...\n\nChorus:\n..."}
                  className="w-full px-4 py-3 rounded-xl border border-mist text-sm font-mono focus:outline-none focus:border-forest resize-y bg-off-white placeholder:text-charcoal/20"
                />
              ) : activeSong.lyrics ? (
                <pre className="text-sm text-charcoal/70 leading-loose whitespace-pre-wrap font-sans bg-off-white rounded-xl px-4 py-3 max-h-[400px] overflow-y-auto">
                  {activeSong.lyrics}
                </pre>
              ) : (
                <div className="bg-off-white rounded-xl px-4 py-6 text-center">
                  <p className="text-sm text-charcoal/30 italic">No lyrics yet</p>
                  <button
                    onClick={() => startEdit(activeSong)}
                    className="mt-2 text-xs text-forest hover:underline"
                  >
                    Add lyrics
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
