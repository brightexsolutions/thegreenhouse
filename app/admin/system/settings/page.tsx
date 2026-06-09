"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";

type SettingsMap = Record<string, string>;

const SETTINGS_FIELDS = [
  { key: "site_name",       label: "Site name",         placeholder: "The Green House",             type: "text" },
  { key: "contact_email",   label: "Contact email",     placeholder: "hello@thegreenhouseke.com",   type: "email" },
  { key: "whatsapp_number", label: "WhatsApp number",   placeholder: "+254712345678",                type: "text" },
  { key: "instagram_handle",label: "Instagram handle",  placeholder: "@thegreenhouseke",             type: "text" },
  { key: "site_tagline",    label: "Site tagline",      placeholder: "Cross-church. Low pressure.",  type: "text" },
] as const;

export default function SettingsPage() {
  const [values, setValues]   = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/system/settings")
      .then(r => r.json())
      .then(data => { setValues(data.settings ?? {}); setLoading(false); });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/system/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: values }),
    });
    if (res.ok) {
      setMsg({ type: "ok", text: "Settings saved" });
    } else {
      setMsg({ type: "err", text: "Failed to save settings" });
    }
    setSaving(false);
    setTimeout(() => setMsg(null), 4000);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-forest">Site Settings</h1>
        <p className="text-sm text-charcoal/50 mt-1">Global configuration for The Green House</p>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${
          msg.type === "ok"
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-600 border border-red-200"
        }`}>
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-mist p-8 text-center">
          <p className="text-sm text-charcoal/40">Loading settings…</p>
        </div>
      ) : (
        <form onSubmit={save} className="bg-white rounded-2xl border border-mist p-6">
          <div className="space-y-4">
            {SETTINGS_FIELDS.map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-charcoal/60 mb-1">{label}</label>
                <input
                  type={type}
                  value={values[key] ?? ""}
                  onChange={e => setValues(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3 py-2.5 rounded-xl border border-mist text-sm focus:outline-none focus:border-forest transition-colors"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-mist">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest text-cream text-sm font-medium hover:bg-moss transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? "Saving…" : "Save settings"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
