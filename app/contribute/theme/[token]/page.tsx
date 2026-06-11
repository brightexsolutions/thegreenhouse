"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, BookOpen, FileText, Save } from "lucide-react";

interface EventInfo {
  id:                 string;
  title:              string;
  event_date:         string;
  slug:               string;
  theme_title:        string | null;
  theme_scripture:    string | null;
  theme_description:  string | null;
}

export default function ThemeContributePage() {
  const { token } = useParams<{ token: string }>();

  const [event,    setEvent]   = useState<EventInfo | null>(null);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState<string | null>(null);
  const [saving,   setSaving]  = useState(false);
  const [saved,    setSaved]   = useState(false);

  const [title,       setTitle]       = useState("");
  const [scripture,   setScripture]   = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetch(`/api/contribute/theme?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setEvent(d.event);
        setTitle(d.event.theme_title        ?? "");
        setScripture(d.event.theme_scripture   ?? "");
        setDescription(d.event.theme_description ?? "");
      })
      .catch(() => setError("Could not load page"))
      .finally(() => setLoading(false));
  }, [token]);

  async function save() {
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/contribute/theme?token=${token}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ theme_title: title, theme_scripture: scripture, theme_description: description }),
    });
    const data = await res.json();
    if (data.ok) setSaved(true);
    else setError(data.error ?? "Failed to save");
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  }

  const eventDate = event ? new Date(event.event_date).toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "";

  if (loading) return (
    <div className="min-h-screen bg-[#f7f2e8] flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-[#1b3a2a]/30" />
    </div>
  );

  if (error && !event) return (
    <div className="min-h-screen bg-[#f7f2e8] flex items-center justify-center p-6">
      <div className="text-center">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-sm text-[#1a1a18]/60">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f2e8]">
      {/* Header */}
      <div className="bg-[#1b3a2a] px-5 py-6">
        <p className="text-[11px] text-[#c9a24a] uppercase tracking-widest font-semibold mb-1">Theme Contributor</p>
        <h1 className="text-xl font-bold text-[#f7f2e8] leading-tight">{event?.title}</h1>
        <p className="text-sm text-[#f7f2e8]/50 mt-1">{eventDate}</p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <p className="text-sm text-[#1a1a18]/60 leading-relaxed">
          Fill in the theme details for this session. The title, scripture, and description will appear on the projection display and in attendee documents.
        </p>

        {/* Theme title */}
        <div className="bg-white rounded-2xl border border-[#e8e3d8] p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={14} className="text-[#1b3a2a]" />
            <h2 className="text-sm font-semibold text-[#1a1a18]">Theme</h2>
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#1a1a18]/40 mb-1.5">
              Theme title
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Delusion, Fire Shut Up In My Bones…"
              className="w-full px-3 py-2.5 rounded-xl border border-[#e8e3d8] text-sm text-[#1a1a18] placeholder:text-[#1a1a18]/30 focus:outline-none focus:border-[#1b3a2a]/40 focus:ring-2 focus:ring-[#1b3a2a]/10"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#1a1a18]/40 mb-1.5">
              Scripture reference
            </label>
            <input
              value={scripture}
              onChange={e => setScripture(e.target.value)}
              placeholder="e.g. 2 Timothy 4:3-6, Jeremiah 20:9…"
              className="w-full px-3 py-2.5 rounded-xl border border-[#e8e3d8] text-sm text-[#1a1a18] placeholder:text-[#1a1a18]/30 focus:outline-none focus:border-[#1b3a2a]/40 focus:ring-2 focus:ring-[#1b3a2a]/10"
            />
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl border border-[#e8e3d8] p-5">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={14} className="text-[#1b3a2a]" />
            <h2 className="text-sm font-semibold text-[#1a1a18]">Description</h2>
          </div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#1a1a18]/40 mb-1.5">
            What is this theme about?
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={5}
            placeholder="Write a short paragraph that sets the context for this theme. This will be shared with attendees and shown on screen."
            className="w-full px-3 py-2.5 rounded-xl border border-[#e8e3d8] text-sm text-[#1a1a18] placeholder:text-[#1a1a18]/30 focus:outline-none focus:border-[#1b3a2a]/40 focus:ring-2 focus:ring-[#1b3a2a]/10 resize-none leading-relaxed"
          />
        </div>

        {/* Save */}
        <button
          onClick={save}
          disabled={saving || (!title.trim() && !scripture.trim() && !description.trim())}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#1b3a2a] text-[#f7f2e8] text-sm font-bold hover:bg-[#2d5240] transition-colors disabled:opacity-50 shadow-sm"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle2 size={15} className="text-green-400" /> : <Save size={15} />}
          {saving ? "Saving…" : saved ? "Saved!" : "Save theme"}
        </button>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <p className="text-center text-xs text-[#1a1a18]/30 pb-8">
          Changes go live immediately on the event display.
        </p>
      </div>
    </div>
  );
}
