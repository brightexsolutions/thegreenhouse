"use client";

import { useState, useEffect } from "react";
import {
  Gamepad2, Plus, Copy, ExternalLink, Trash2,
  Check, Loader2, AlertTriangle, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Permission = "full" | "music" | "scenes" | "trivia" | "feedback";

const PERMISSION_META: Record<Permission, { label: string; desc: string; color: string }> = {
  full:     { label: "Full access",  desc: "All tabs — scenes, music, trivia, feedback", color: "bg-forest/15 text-forest border-forest/25" },
  music:    { label: "Music",        desc: "Song selection and verse navigation",         color: "bg-gold/15 text-gold/80 border-gold/25" },
  scenes:   { label: "Scenes",       desc: "Scene switcher and display themes",           color: "bg-blue-50 text-blue-700 border-blue-200" },
  trivia:   { label: "Trivia",       desc: "Launch and manage trivia rounds",             color: "bg-purple-50 text-purple-700 border-purple-200" },
  feedback: { label: "Feedback",     desc: "View and project audience reflections",       color: "bg-amber-50 text-amber-700 border-amber-200" },
};

interface ControlLink {
  id:          string;
  label:       string;
  permissions: Permission[];
  token:       string;
  created_at:  string;
}

interface Props {
  eventId:   string;
  eventSlug: string;
  initial:   ControlLink[];
}

export function ControlLinksPanel({ eventId, eventSlug, initial }: Props) {
  const [links,       setLinks]       = useState<ControlLink[]>(initial);
  const [origin,      setOrigin]      = useState("");
  const [showForm,    setShowForm]    = useState(false);
  const [label,       setLabel]       = useState("");
  const [perms,       setPerms]       = useState<Permission[]>(["full"]);
  const [saving,      setSaving]      = useState(false);
  const [copied,      setCopied]      = useState<string | null>(null);
  const [revoking,    setRevoking]    = useState<string | null>(null);
  const [confirmDel,  setConfirmDel]  = useState<string | null>(null);

  useEffect(() => { setOrigin(window.location.origin); }, []);

  function controlUrl(token: string) {
    return `${origin}/live/${eventSlug}/control?t=${token}`;
  }

  function togglePerm(p: Permission) {
    if (p === "full") {
      setPerms(["full"]);
      return;
    }
    setPerms(prev => {
      const withoutFull = prev.filter(x => x !== "full");
      return withoutFull.includes(p)
        ? withoutFull.filter(x => x !== p)
        : [...withoutFull, p];
    });
  }

  async function createLink() {
    if (!label.trim() || perms.length === 0) return;
    setSaving(true);
    const res = await fetch(`/api/admin/events/${eventId}/control-links`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ label: label.trim(), permissions: perms }),
    });
    if (res.ok) {
      const { link } = await res.json() as { link: ControlLink };
      setLinks(prev => [...prev, link]);
      setLabel(""); setPerms(["full"]); setShowForm(false);
    }
    setSaving(false);
  }

  async function revokeLink(id: string) {
    setRevoking(id);
    const res = await fetch(`/api/admin/events/${eventId}/control-links/${id}`, { method: "DELETE" });
    if (res.ok) setLinks(prev => prev.filter(l => l.id !== id));
    setRevoking(null);
    setConfirmDel(null);
  }

  async function copyUrl(token: string) {
    await navigator.clipboard.writeText(controlUrl(token));
    setCopied(token);
    setTimeout(() => setCopied(null), 2500);
  }

  return (
    <div className="bg-white rounded-2xl border border-mist p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Gamepad2 size={13} className="text-forest" />
          <h3 className="text-sm font-semibold text-charcoal">Control Panel Access</h3>
        </div>
        <button
          onClick={() => { setShowForm(s => !s); setLabel(""); setPerms(["full"]); }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
            showForm ? "bg-charcoal/8 text-charcoal/60" : "bg-forest text-cream hover:bg-moss"
          )}
        >
          {showForm ? <><ChevronUp size={12} /> Cancel</> : <><Plus size={12} /> Add link</>}
        </button>
      </div>
      <p className="text-xs text-charcoal/50 mb-4 leading-relaxed">
        Generate access links for worship leaders and team members. Each link can be scoped to specific sections — no admin login needed.
      </p>

      {/* ── Create form ── */}
      {showForm && (
        <div className="bg-off-white rounded-2xl border border-forest/15 p-4 mb-4 space-y-3">
          <p className="text-xs font-semibold text-forest">New access link</p>

          <input
            autoFocus
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Role or name (e.g. Worship Leader)"
            className="w-full px-3 py-2 rounded-xl border border-mist bg-white text-sm focus:outline-none focus:border-forest"
          />

          <div>
            <p className="text-[10px] font-semibold text-charcoal/40 uppercase tracking-wider mb-2">Permissions</p>
            <div className="space-y-1.5">
              {(Object.entries(PERMISSION_META) as [Permission, typeof PERMISSION_META[Permission]][]).map(([key, meta]) => {
                const effectivelyChecked = key === "full" ? perms.includes("full") : perms.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => togglePerm(key)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all",
                      effectivelyChecked ? "border-forest/30 bg-forest/5" : "border-mist bg-white hover:border-forest/20 hover:bg-forest/3"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors",
                      effectivelyChecked ? "bg-forest border-forest" : "border-charcoal/25"
                    )}>
                      {effectivelyChecked && (
                        <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-charcoal">{meta.label}</p>
                      <p className="text-[10px] text-charcoal/40 mt-0.5">{meta.desc}</p>
                    </div>
                    {key !== "full" && perms.includes("full") && (
                      <span className="text-[9px] text-charcoal/25 flex-shrink-0">click to switch</span>
                    )}
                  </button>
                );
              })}
            </div>
            {!perms.includes("full") && perms.length === 0 && (
              <p className="text-[10px] text-red-500 mt-1.5">Select at least one permission</p>
            )}
          </div>

          <button
            onClick={createLink}
            disabled={saving || !label.trim() || perms.length === 0}
            className="w-full py-2.5 rounded-xl bg-forest text-cream text-xs font-semibold hover:bg-moss transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 size={13} className="animate-spin" /> Generating…</> : "Generate link"}
          </button>
        </div>
      )}

      {/* ── Links list ── */}
      {links.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-2xl bg-forest/6 flex items-center justify-center mx-auto mb-3">
            <Gamepad2 size={18} className="text-forest/30" />
          </div>
          <p className="text-xs text-charcoal/35">No access links yet</p>
          <p className="text-[11px] text-charcoal/25 mt-0.5">Create one to share the control panel with team members</p>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map(link => (
            <div key={link.id} className="rounded-xl border border-mist bg-off-white/50 p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-charcoal">{link.label}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {link.permissions.map(p => (
                      <span key={p} className={cn(
                        "text-[10px] font-semibold px-1.5 py-0.5 rounded-md border",
                        PERMISSION_META[p]?.color ?? "bg-charcoal/8 text-charcoal/50 border-charcoal/10"
                      )}>
                        {PERMISSION_META[p]?.label ?? p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Revoke */}
                {confirmDel === link.id ? (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[10px] text-amber-600 font-medium">Revoke?</span>
                    <button
                      onClick={() => revokeLink(link.id)}
                      disabled={!!revoking}
                      className="px-2 py-1 rounded-lg bg-red-500 text-white text-[10px] font-semibold hover:bg-red-600 disabled:opacity-50"
                    >
                      {revoking === link.id ? <Loader2 size={10} className="animate-spin" /> : "Yes"}
                    </button>
                    <button
                      onClick={() => setConfirmDel(null)}
                      className="px-2 py-1 rounded-lg border border-mist text-[10px] text-charcoal/50 hover:border-charcoal/30"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDel(link.id)}
                    title="Revoke link"
                    className="p-1.5 rounded-lg text-charcoal/25 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              {/* URL + actions */}
              <div className="bg-white rounded-lg border border-mist px-2.5 py-1.5 mb-2">
                <p className="text-[10px] font-mono text-charcoal/40 truncate">{controlUrl(link.token)}</p>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => copyUrl(link.token)}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-forest text-cream text-[11px] font-semibold hover:bg-moss transition-colors"
                >
                  {copied === link.token
                    ? <><Check size={11} /> Copied!</>
                    : <><Copy size={11} /> Copy link</>}
                </button>
                <a
                  href={controlUrl(link.token)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-forest/30 text-forest text-[11px] font-semibold hover:bg-forest/5 transition-colors"
                >
                  <ExternalLink size={11} /> Open
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {links.length > 0 && (
        <p className="text-[10px] text-charcoal/30 mt-3 flex items-center gap-1">
          <AlertTriangle size={9} />
          Revoking a link immediately invalidates it — the holder will lose access.
        </p>
      )}
    </div>
  );
}
