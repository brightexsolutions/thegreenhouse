"use client";

import { useEffect, useState } from "react";
import { Music2, ChevronDown, ChevronUp, Plus, Loader2, CheckCircle2, AlertCircle, Search, Mic2, User, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Song {
  id:           string;
  title:        string;
  artist:       string | null;
  lyrics:       string | null;
  submitted_by: string | null;
  created_at:   string;
}

interface EventInfo {
  id:         string;
  title:      string;
  event_date: string;
  slug:       string;
}

const VOCALIST_KEY = "contribute_vocalist_name";
const PAGE_SIZE    = 10;

function getStoredVocalist(): string {
  try { return localStorage.getItem(VOCALIST_KEY) ?? ""; } catch { return ""; }
}
function saveVocalist(name: string) {
  try { localStorage.setItem(VOCALIST_KEY, name); } catch { /* ignore */ }
}

function SongRow({ song, isOpen, onToggle, showSubmitter }: { song: Song; isOpen: boolean; onToggle: () => void; showSubmitter?: boolean }) {
  return (
    <div className="border border-mist rounded-2xl overflow-hidden transition-all">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-off-white transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-full bg-forest/8 flex items-center justify-center flex-shrink-0">
          <Music2 size={13} className="text-forest" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-charcoal truncate">{song.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {song.artist && <p className="text-xs text-charcoal/45">{song.artist}</p>}
            {showSubmitter && song.submitted_by && (
              <span className="text-[10px] text-charcoal/35 flex items-center gap-1">
                <Mic2 size={9} className="inline" />{song.submitted_by}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {song.lyrics ? (
            <span className="text-[10px] text-forest/60 bg-forest/8 px-2 py-0.5 rounded-full">Has lyrics</span>
          ) : (
            <span className="text-[10px] text-charcoal/30 bg-charcoal/5 px-2 py-0.5 rounded-full">No lyrics</span>
          )}
          {isOpen ? <ChevronUp size={14} className="text-charcoal/30" /> : <ChevronDown size={14} className="text-charcoal/30" />}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-mist px-4 py-4 bg-off-white">
          {song.lyrics ? (
            <pre className="text-sm text-charcoal/70 whitespace-pre-wrap font-sans leading-relaxed">
              {song.lyrics}
            </pre>
          ) : (
            <p className="text-sm text-charcoal/35 italic">No lyrics added yet</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ContributePage({ params }: { params: { token: string } }) {
  const { token } = params;

  const [event,          setEvent]          = useState<EventInfo | null>(null);
  const [songs,          setSongs]          = useState<Song[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [invalid,        setInvalid]        = useState(false);
  const [query,          setQuery]          = useState("");
  const [tab,            setTab]            = useState<"all" | "mine">("all");
  const [openSongId,     setOpenSongId]     = useState<string | null>(null);
  const [visibleCount,   setVisibleCount]   = useState(PAGE_SIZE);

  // Vocalist dialog
  const [vocalistDialog, setVocalistDialog] = useState(false);
  const [vocalistInput,  setVocalistInput]  = useState("");
  const [vocalistName,   setVocalistName]   = useState<string | null>(null);

  // Form state
  const [title,    setTitle]    = useState("");
  const [artist,   setArtist]   = useState("");
  const [lyrics,   setLyrics]   = useState("");
  const [saving,   setSaving]   = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    fetch(`/api/songs?token=${token}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(({ event: ev, songs: s }) => {
        setEvent(ev);
        setSongs(s);
        // Show vocalist dialog after load — check stored name first
        const stored = getStoredVocalist();
        if (stored) {
          setVocalistName(stored);
        } else {
          setTimeout(() => setVocalistDialog(true), 600);
        }
      })
      .catch(status => { if (status === 404) setInvalid(true); })
      .finally(() => setLoading(false));
  }, [token]);

  function confirmVocalist() {
    const name = vocalistInput.trim();
    setVocalistName(name || null);
    if (name) saveVocalist(name);
    setVocalistDialog(false);
  }

  function dismissVocalist() {
    setVocalistName(null);
    setVocalistDialog(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setFeedback(null);
    const res = await fetch(`/api/songs?token=${token}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ title, artist, lyrics, vocalist_name: vocalistName }),
    });
    const data = await res.json() as { song?: Song; error?: string; existing?: Song };
    setSaving(false);
    if (res.ok && data.song) {
      setSongs(prev => [data.song!, ...prev]);
      setTitle(""); setArtist(""); setLyrics("");
      setFeedback({ type: "success", msg: `"${data.song.title}" added successfully!` });
      setTimeout(() => setFeedback(null), 4000);
    } else if (res.status === 409) {
      setFeedback({ type: "error", msg: `"${title}" already exists in the library.` });
    } else {
      setFeedback({ type: "error", msg: data.error ?? "Something went wrong. Please try again." });
    }
  }

  const mySongs = vocalistName
    ? songs.filter(s => s.submitted_by?.toLowerCase() === vocalistName.toLowerCase())
    : [];

  const baseList = tab === "mine" ? mySongs : songs;

  const filtered = baseList.filter(s => {
    const q = query.toLowerCase();
    return !q || s.title.toLowerCase().includes(q) || (s.artist ?? "").toLowerCase().includes(q);
  });

  const visibleSongs = filtered.slice(0, visibleCount);
  const hasMore      = filtered.length > visibleCount;

  const formattedDate = event
    ? new Date(event.event_date).toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-forest/30" />
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-charcoal/5 flex items-center justify-center mx-auto mb-4">
            <Music2 size={20} className="text-charcoal/25" />
          </div>
          <p className="text-sm font-semibold text-charcoal/60">This link is invalid or has expired.</p>
          <p className="text-xs text-charcoal/35 mt-1">Ask the admin to share the current contribution link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white">

      {/* ── Vocalist dialog ── */}
      {vocalistDialog && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-forest/8 flex items-center justify-center">
                  <Mic2 size={16} className="text-forest" />
                </div>
                <h2 className="text-sm font-semibold text-charcoal">Will you be singing?</h2>
              </div>
              <button onClick={dismissVocalist} className="w-7 h-7 rounded-xl bg-charcoal/5 hover:bg-charcoal/10 flex items-center justify-center transition-colors">
                <X size={13} className="text-charcoal/40" />
              </button>
            </div>

            <p className="text-sm text-charcoal/60 mb-4 leading-relaxed">
              Are you a vocalist for <span className="font-semibold text-charcoal">{event?.title.replace("The Green House — ", "")}</span>?
              Add your name so your songs are credited to you on the program.
            </p>

            <div className="mb-4">
              <label className="text-xs font-semibold text-charcoal/60 mb-1.5 block">Your preferred name</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" />
                <input
                  value={vocalistInput}
                  onChange={e => setVocalistInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") confirmVocalist(); }}
                  placeholder="e.g. Sarah M."
                  autoFocus
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-mist text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={confirmVocalist}
                className="flex-1 py-3 rounded-xl bg-forest text-cream text-sm font-semibold hover:bg-moss transition-colors"
              >
                {vocalistInput.trim() ? "I'm a vocalist" : "Yes, I am"}
              </button>
              <button
                onClick={dismissVocalist}
                className="flex-1 py-3 rounded-xl border border-mist text-sm text-charcoal/60 hover:text-charcoal hover:border-charcoal/20 transition-colors"
              >
                Just browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-forest text-cream px-4 py-6 md:px-6">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center">
              <Music2 size={11} className="text-gold" />
            </div>
            <span className="text-xs uppercase tracking-widest text-cream/65">The Green House</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-cream mt-2">{event?.title}</h1>
          <p className="text-sm text-cream/70 mt-0.5">{formattedDate}</p>
          {vocalistName && (
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1.5 bg-gold/15 text-gold px-3 py-1.5 rounded-full text-xs font-semibold">
                <Mic2 size={11} />
                Vocalist: {vocalistName}
              </div>
              <button
                onClick={() => { setVocalistInput(vocalistName); setVocalistDialog(true); }}
                className="text-[10px] text-cream/35 hover:text-cream/60 transition-colors"
              >
                Change
              </button>
            </div>
          )}
          {!vocalistName && !vocalistDialog && (
            <button
              onClick={() => { setVocalistInput(""); setVocalistDialog(true); }}
              className="mt-3 flex items-center gap-1.5 text-xs text-cream/40 hover:text-cream/70 transition-colors"
            >
              <Mic2 size={11} />
              Are you a vocalist? Tap to add your name
            </button>
          )}
          <p className="text-sm text-cream/55 mt-3">
            Add the songs you&apos;ll be singing. Others can see the full list and read lyrics.
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 md:px-6 space-y-6">

        {/* Submission form */}
        <div className="bg-white rounded-2xl border border-mist p-5">
          <h2 className="text-sm font-semibold text-charcoal mb-4 flex items-center gap-2">
            <Plus size={14} className="text-forest" /> Submit a song
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-charcoal/70 mb-1.5 block">Song title *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Great Are You Lord"
                required
                className="w-full px-3.5 py-3 rounded-xl border border-mist text-base text-charcoal placeholder:text-charcoal/35 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal/70 mb-1.5 block">Artist / band <span className="text-charcoal/40 font-normal">(optional)</span></label>
              <input
                value={artist}
                onChange={e => setArtist(e.target.value)}
                placeholder="e.g. All Sons & Daughters"
                className="w-full px-3.5 py-3 rounded-xl border border-mist text-base text-charcoal placeholder:text-charcoal/35 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal/70 mb-1.5 block">
                Lyrics <span className="text-charcoal/40 font-normal">(optional — separate verses with a blank line)</span>
              </label>
              <textarea
                value={lyrics}
                onChange={e => setLyrics(e.target.value)}
                placeholder={"Verse 1 lyrics here...\n\nChorus lyrics here...\n\nVerse 2 lyrics here..."}
                rows={7}
                className="w-full px-3.5 py-3 rounded-xl border border-mist text-base text-charcoal placeholder:text-charcoal/35 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40 transition-all resize-none leading-relaxed"
              />
            </div>

            {vocalistName && (
              <p className="text-xs text-forest/70 bg-forest/5 px-3 py-2 rounded-xl flex items-center gap-1.5">
                <Mic2 size={11} />
                This song will be credited to <span className="font-semibold">{vocalistName}</span>
              </p>
            )}

            {feedback && (
              <div className={cn(
                "flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs",
                feedback.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-100"
                  : "bg-red-50 text-red-600 border border-red-100"
              )}>
                {feedback.type === "success"
                  ? <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0" />
                  : <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />}
                {feedback.msg}
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="w-full py-3 rounded-xl bg-forest text-cream text-sm font-semibold hover:bg-moss transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : "Submit song"}
            </button>
          </form>
        </div>

        {/* Song library */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-charcoal">
              Song library
              <span className="ml-2 text-xs font-normal text-charcoal/40">{songs.length} song{songs.length !== 1 ? "s" : ""}</span>
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-charcoal/5 rounded-xl mb-3">
            <button
              onClick={() => { setTab("all"); setVisibleCount(PAGE_SIZE); setOpenSongId(null); }}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all",
                tab === "all" ? "bg-white text-charcoal shadow-sm" : "text-charcoal/45 hover:text-charcoal/70"
              )}
            >
              All songs
              {songs.length > 0 && <span className="ml-1 text-[10px] opacity-60">({songs.length})</span>}
            </button>
            <button
              onClick={() => { setTab("mine"); setVisibleCount(PAGE_SIZE); setOpenSongId(null); }}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all",
                tab === "mine" ? "bg-white text-charcoal shadow-sm" : "text-charcoal/45 hover:text-charcoal/70"
              )}
            >
              Mine
              {mySongs.length > 0 && <span className="ml-1 text-[10px] opacity-60">({mySongs.length})</span>}
            </button>
          </div>

          {/* "Mine" tab with no vocalist set */}
          {tab === "mine" && !vocalistName && (
            <div className="flex flex-col items-center py-8 bg-white rounded-2xl border border-mist mb-3">
              <Mic2 size={20} className="text-charcoal/20 mb-2" />
              <p className="text-sm text-charcoal/50 font-medium">Set your vocalist name first</p>
              <button
                onClick={() => { setVocalistInput(""); setVocalistDialog(true); }}
                className="mt-3 px-4 py-2 rounded-xl bg-forest text-cream text-xs font-semibold hover:bg-moss transition-colors"
              >
                Add my name
              </button>
            </div>
          )}

          {/* Search — always visible when there are songs or a query */}
          {(tab === "all" || vocalistName) && (
            <div className="relative mb-3">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" />
              <input
                value={query}
                onChange={e => { setQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
                placeholder="Search songs…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-mist bg-white text-sm placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40 transition-all"
              />
            </div>
          )}

          {(tab === "all" || vocalistName) && (
            visibleSongs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-mist">
                <div className="w-10 h-10 rounded-2xl bg-charcoal/5 flex items-center justify-center mb-3">
                  <Music2 size={16} className="text-charcoal/20" />
                </div>
                <p className="text-sm text-charcoal/40 font-medium">
                  {query
                    ? "No songs match your search"
                    : tab === "mine"
                    ? "You haven't submitted any songs yet"
                    : "No songs submitted yet"}
                </p>
                {!query && tab === "all" && <p className="text-xs text-charcoal/25 mt-1">Be the first to add one above</p>}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {visibleSongs.map(song => (
                    <SongRow
                      key={song.id}
                      song={song}
                      isOpen={openSongId === song.id}
                      onToggle={() => setOpenSongId(prev => prev === song.id ? null : song.id)}
                      showSubmitter={tab === "all"}
                    />
                  ))}
                </div>

                {hasMore && (
                  <button
                    onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                    className="w-full mt-3 py-3 rounded-xl border border-mist text-sm text-charcoal/50 hover:text-forest hover:border-forest/20 transition-all"
                  >
                    Load more ({filtered.length - visibleCount} remaining)
                  </button>
                )}
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}
