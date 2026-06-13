"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Globe, Mail, Share2, Sliders } from "lucide-react";
import { cn } from "@/lib/utils";

type SettingsMap = Record<string, string>;

const SECTIONS = [
  {
    key: "identity",
    icon: Globe,
    title: "Site Identity",
    description: "The name and description shown across the platform and in emails.",
    fields: [
      { key: "site_name",    label: "Site name",    placeholder: "The Green House", type: "text" },
      { key: "site_tagline", label: "Tagline",       placeholder: "Cross-church. Low pressure.", type: "text" },
    ],
  },
  {
    key: "contact",
    icon: Mail,
    title: "Contact",
    description: "Used in email footers, confirmation messages, and the public contact page.",
    fields: [
      { key: "contact_email",   label: "Contact email",   placeholder: "thegreenhouse.contact01@gmail.com",  type: "email" },
      { key: "whatsapp_number", label: "WhatsApp number", placeholder: "+254717645180",              type: "tel" },
    ],
  },
  {
    key: "social",
    icon: Share2,
    title: "Social Links",
    description: "Social media handles and links shown in the footer.",
    fields: [
      { key: "instagram_handle", label: "Instagram handle", placeholder: "@thegreenhouseke", type: "text" },
      { key: "twitter_handle",   label: "X / Twitter handle", placeholder: "@thegreenhouseke", type: "text" },
      { key: "facebook_url",     label: "Facebook page URL", placeholder: "https://facebook.com/...", type: "url" },
    ],
  },
  {
    key: "platform",
    icon: Sliders,
    title: "Platform Behaviour",
    description: "Global toggles that affect how the platform behaves for all visitors.",
    fields: [
      { key: "registration_open",  label: "Registration status (\"open\" or \"closed\")", placeholder: "open", type: "text" },
      { key: "default_capacity",   label: "Default event capacity",     placeholder: "150",  type: "number" },
    ],
  },
  {
    key: "giving",
    icon: Sliders,
    title: "Financial Support",
    description: "Payment details shown to people who want to give financially. Leave blank to hide that field.",
    fields: [
      { key: "giving_paybill",  label: "M-Pesa Paybill number",  placeholder: "400200",      type: "text" },
      { key: "giving_account",  label: "Paybill account name",   placeholder: "GREENHOUSE",  type: "text" },
      { key: "giving_till",     label: "Buy Goods till number",  placeholder: "5551234",     type: "text" },
      { key: "giving_phone",    label: "Send Money phone",       placeholder: "0706609085",  type: "tel" },
    ],
  },
] as const;

export default function SettingsPage() {
  const [values,  setValues]  = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/system/settings")
      .then(r => r.json())
      .then(data => { setValues(data.settings ?? {}); setLoading(false); });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/system/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: values }),
    });
    setMsg(res.ok ? { type: "ok", text: "Settings saved successfully" } : { type: "err", text: "Failed to save settings" });
    setSaving(false);
    setTimeout(() => setMsg(null), 5000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={20} className="animate-spin text-forest/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-charcoal">Site Settings</h1>
        <p className="text-sm text-charcoal/45 mt-1">Global configuration for The Green House platform</p>
      </div>

      {msg && (
        <div className={cn(
          "mb-5 px-4 py-3 rounded-xl text-sm border",
          msg.type === "ok"
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-red-50 text-red-600 border-red-200"
        )}>
          {msg.text}
        </div>
      )}

      <form onSubmit={save} className="space-y-5">
        {SECTIONS.map(({ key, icon: Icon, title, description, fields }) => (
          <div key={key} className="bg-white rounded-2xl border border-mist overflow-hidden">
            {/* Section header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-mist bg-off-white/60">
              <div className="w-8 h-8 rounded-xl bg-forest/8 flex items-center justify-center flex-shrink-0">
                <Icon size={14} className="text-forest" />
              </div>
              <div>
                <p className="text-sm font-semibold text-charcoal">{title}</p>
                <p className="text-[11px] text-charcoal/45 mt-0.5">{description}</p>
              </div>
            </div>

            {/* Fields */}
            <div className="px-5 py-4 space-y-4">
              {fields.map(({ key: fkey, label, placeholder, type }) => (
                <div key={fkey}>
                  <label className="block text-xs font-semibold text-charcoal/60 mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={values[fkey] ?? ""}
                    onChange={e => setValues(prev => ({ ...prev, [fkey]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-mist text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40 transition-all bg-white"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex items-center gap-3 pb-6">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-forest text-cream text-sm font-semibold hover:bg-moss transition-all disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "Saving…" : "Save all settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
