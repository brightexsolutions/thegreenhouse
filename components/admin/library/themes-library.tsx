"use client";

import { useState } from "react";
import { Palette, Plus, X, BookOpen, ChevronDown, Loader2, CheckCircle2, AlertCircle, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm-dialog";

type Theme = {
  id:          string;
  title:       string;
  scripture:   string | null;
  description: string | null;
  created_at:  string;
};

type Event = {
  id:         string;
  title:      string;
  event_date: string;
  theme_id:   string | null;
};

interface Props {
  initialThemes: Theme[];
  events:        Event[];
}

function ThemeCard({
  theme,
  events,
  onUpdated,
  onDeleted,
}: {
  theme:     Theme;
  events:    Event[];
  onUpdated: (t: Theme) => void;
  onDeleted: (id: string) => void;
}) {
  const confirm = useConfirm();
  const [expanded,    setExpanded]    = useState(false);
  const [,            setAssigning]   = useState(false);
  const [editing,     setEditing]     = useState(false);
  const [busy,        setBusy]        = useState<string | null>(null);
  const [msg,         setMsg]         = useState<{ ok: boolean; text: string } | null>(null);

  // Edit state
  const [eTitle, setETitle] = useState(theme.title);
  const [eScripture, setEScripture] = useState(theme.scripture ?? "");
  const [eDesc, setEDesc] = useState(theme.description ?? "");

  const assigned = events.filter(e => e.theme_id === theme.id);
  const unassigned = events.filter(e => e.theme_id !== theme.id);

  function flash(ok: boolean, text: string) {
    setMsg({ ok, text });
    setTimeout(() => setMsg(null), 3000);
  }

  async function doAssign(eventId: string) {
    setBusy(eventId);
    const res = await fetch("/api/admin/themes", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action: "assign", theme_id: theme.id, event_id: eventId }),
    });
    setBusy(null);
    if (res.ok) {
      flash(true, "Theme assigned");
      setAssigning(false);
      onUpdated(theme); // triggers parent reload
    } else {
      flash(false, "Failed to assign");
    }
  }

  async function doUnassign(eventId: string) {
    setBusy(eventId);
    const res = await fetch("/api/admin/themes", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action: "unassign", event_id: eventId }),
    });
    setBusy(null);
    if (res.ok) {
      flash(true, "Theme removed from event");
      onUpdated(theme);
    } else {
      flash(false, "Failed to unassign");
    }
  }

  async function doEdit(e: React.FormEvent) {
    e.preventDefault();
    setBusy("edit");
    const res = await fetch("/api/admin/themes", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id: theme.id, title: eTitle, scripture: eScripture, description: eDesc }),
    });
    setBusy(null);
    if (res.ok) {
      flash(true, "Saved");
      setEditing(false);
      onUpdated({ ...theme, title: eTitle, scripture: eScripture || null, description: eDesc || null });
    } else {
      flash(false, "Failed to save");
    }
  }

  async function doDelete() {
    const ok = await confirm({ title: `Delete "${theme.title}"?`, message: "This theme will be permanently deleted and unassigned from any events.", destructive: true });
    if (!ok) return;
    setBusy("del");
    const res = await fetch(`/api/admin/themes?id=${theme.id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) onDeleted(theme.id);
  }

  return (
    <div className="bg-white rounded-2xl border border-mist overflow-hidden">
      {/* Card header */}
      <div className="flex items-start gap-4 p-5">
        <div className="w-10 h-10 rounded-xl bg-forest/8 flex items-center justify-center flex-shrink-0">
          <Palette size={16} className="text-forest" />
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <form onSubmit={doEdit} className="space-y-2" onClick={e => e.stopPropagation()}>
              <input
                value={eTitle}
                onChange={e => setETitle(e.target.value)}
                placeholder="Theme title"
                required
                className="w-full px-3 py-2 rounded-xl border border-mist text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40"
              />
              <input
                value={eScripture}
                onChange={e => setEScripture(e.target.value)}
                placeholder="Scripture reference (optional)"
                className="w-full px-3 py-2 rounded-xl border border-mist text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40"
              />
              <textarea
                value={eDesc}
                onChange={e => setEDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-mist text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40 resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy === "edit"}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest text-cream text-xs font-semibold disabled:opacity-50"
                >
                  {busy === "edit" ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-3 py-1.5 rounded-xl border border-mist text-xs text-charcoal/60"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <h3 className="text-base font-semibold text-forest font-display">{theme.title}</h3>
              {theme.scripture && (
                <p className="text-xs text-charcoal/50 mt-0.5 flex items-center gap-1">
                  <BookOpen size={11} /> {theme.scripture}
                </p>
              )}
              {theme.description && (
                <p className="text-sm text-charcoal/60 mt-1.5 leading-relaxed">{theme.description}</p>
              )}
              {assigned.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {assigned.map(ev => (
                    <span key={ev.id} className="inline-flex items-center gap-1 text-[10px] bg-forest/8 text-forest px-2 py-0.5 rounded-full font-medium">
                      {ev.title.replace("The Green House — ", "")}
                      <button
                        onClick={() => doUnassign(ev.id)}
                        disabled={busy === ev.id}
                        className="text-forest/40 hover:text-rose-500 transition-colors"
                        title="Unassign from this event"
                      >
                        {busy === ev.id ? <Loader2 size={8} className="animate-spin" /> : <X size={8} />}
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        {!editing && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => { setExpanded(v => !v); setAssigning(false); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-mist text-xs text-charcoal/60 hover:text-forest hover:border-forest/20 transition-all"
            >
              <Plus size={11} />
              Assign
              <ChevronDown size={10} className={cn("transition-transform", expanded ? "rotate-180" : "")} />
            </button>
            <button
              onClick={() => { setEditing(true); setExpanded(false); }}
              className="w-7 h-7 rounded-xl border border-mist flex items-center justify-center text-charcoal/30 hover:text-forest hover:border-forest/20 transition-all"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={doDelete}
              disabled={busy === "del"}
              className="w-7 h-7 rounded-xl border border-mist flex items-center justify-center text-charcoal/30 hover:text-rose-500 hover:border-rose-200 transition-all disabled:opacity-50"
            >
              {busy === "del" ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={12} />}
            </button>
          </div>
        )}
      </div>

      {/* Feedback message */}
      {msg && (
        <div className={cn("mx-5 mb-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs",
          msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600")}>
          {msg.ok ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
          {msg.text}
        </div>
      )}

      {/* Assign dropdown */}
      {expanded && !editing && (
        <div className="border-t border-mist px-5 py-3 bg-off-white">
          {unassigned.length === 0 ? (
            <p className="text-xs text-charcoal/40 italic">All events already use this theme</p>
          ) : (
            <>
              <p className="text-[10px] font-semibold text-charcoal/40 uppercase tracking-wider mb-2">Assign to event</p>
              <div className="space-y-1">
                {unassigned.map(ev => (
                  <button
                    key={ev.id}
                    onClick={() => doAssign(ev.id)}
                    disabled={!!busy}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-forest/5 text-sm text-charcoal transition-colors disabled:opacity-50"
                  >
                    <span className="font-medium">{ev.title.replace("The Green House — ", "")}</span>
                    <span className="flex items-center gap-1 text-[10px] text-forest">
                      {busy === ev.id ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                      Assign
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function ThemesLibrary({ initialThemes, events: initialEvents }: Props) {
  const [themes,    setThemes]    = useState<Theme[]>(initialThemes);
  const [events,    setEvents]    = useState<Event[]>(initialEvents);
  const [creating,  setCreating]  = useState(false);
  const [title,     setTitle]     = useState("");
  const [scripture, setScripture] = useState("");
  const [desc,      setDesc]      = useState("");
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState<{ ok: boolean; text: string } | null>(null);

  function flash(ok: boolean, text: string) {
    setMsg({ ok, text });
    setTimeout(() => setMsg(null), 3000);
  }

  async function reloadEvents() {
    const res = await fetch("/api/admin/themes");
    if (res.ok) {
      const data = await res.json() as { themes: Theme[]; events: Event[] };
      setEvents(data.events);
    }
  }

  async function createTheme(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/themes", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ title, scripture, description: desc }),
    });
    const data = await res.json() as { theme?: Theme; error?: string };
    setSaving(false);
    if (res.ok && data.theme) {
      setThemes(prev => [data.theme!, ...prev]);
      setTitle(""); setScripture(""); setDesc(""); setCreating(false);
      flash(true, `"${data.theme.title}" created`);
    } else {
      flash(false, data.error ?? "Failed to create");
    }
  }

  function handleUpdated(updated: Theme) {
    setThemes(prev => prev.map(t => t.id === updated.id ? updated : t));
    reloadEvents();
  }

  function handleDeleted(id: string) {
    setThemes(prev => prev.filter(t => t.id !== id));
    reloadEvents();
  }

  return (
    <div className="space-y-4">
      {/* New theme button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-charcoal/40">{themes.length} theme{themes.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => setCreating(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-forest text-cream text-sm font-semibold hover:bg-moss transition-colors"
        >
          <Plus size={14} />
          New theme
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="bg-white rounded-2xl border border-forest/20 p-5">
          <h3 className="text-sm font-semibold text-charcoal mb-4 flex items-center gap-2">
            <Palette size={14} className="text-forest" /> New theme
          </h3>
          <form onSubmit={createTheme} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-charcoal/60 mb-1.5 block">Theme title *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Delusion"
                required
                autoFocus
                className="w-full px-3.5 py-3 rounded-xl border border-mist text-sm text-charcoal placeholder:text-charcoal/35 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal/60 mb-1.5 block">Scripture <span className="font-normal text-charcoal/35">(optional)</span></label>
              <input
                value={scripture}
                onChange={e => setScripture(e.target.value)}
                placeholder="e.g. 2 Timothy 4:3-6"
                className="w-full px-3.5 py-3 rounded-xl border border-mist text-sm text-charcoal placeholder:text-charcoal/35 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-charcoal/60 mb-1.5 block">Description <span className="font-normal text-charcoal/35">(optional)</span></label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="A short description or reflection prompt…"
                rows={2}
                className="w-full px-3.5 py-3 rounded-xl border border-mist text-sm text-charcoal placeholder:text-charcoal/35 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40 resize-none"
              />
            </div>
            {msg && (
              <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl text-xs",
                msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600")}>
                {msg.ok ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                {msg.text}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-cream text-sm font-semibold disabled:opacity-40 hover:bg-moss transition-colors"
              >
                {saving ? <><Loader2 size={13} className="animate-spin" />Saving…</> : "Create theme"}
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="px-4 py-2.5 rounded-xl border border-mist text-sm text-charcoal/60 hover:text-charcoal transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Global message (outside creating) */}
      {msg && !creating && (
        <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl text-xs",
          msg.ok ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-600 border border-red-100")}>
          {msg.ok ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
          {msg.text}
        </div>
      )}

      {/* Theme list */}
      {themes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-mist p-12 text-center">
          <Palette size={28} className="text-charcoal/15 mx-auto mb-3" />
          <p className="text-sm text-charcoal/40">No themes yet</p>
          <p className="text-xs text-charcoal/25 mt-1">Create a theme and assign it to events</p>
        </div>
      ) : (
        <div className="space-y-3">
          {themes.map(t => (
            <ThemeCard
              key={t.id}
              theme={t}
              events={events}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
