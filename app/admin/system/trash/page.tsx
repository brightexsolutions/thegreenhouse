"use client";

import { useState, useEffect } from "react";
import { Trash2, RotateCcw, Calendar, Users } from "lucide-react";

type DeletedEvent = {
  id: string;
  title: string;
  event_date: string;
  status: string;
  deleted_at: string;
};

type DeletedRegistration = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  deleted_at: string;
  events: { title: string } | null;
};

type Tab = "events" | "registrations";

export default function TrashPage() {
  const [tab, setTab]               = useState<Tab>("events");
  const [events, setEvents]         = useState<DeletedEvent[]>([]);
  const [registrations, setRegs]    = useState<DeletedRegistration[]>([]);
  const [loading, setLoading]       = useState(true);
  const [restoring, setRestoring]   = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch("/api/admin/system/trash");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events ?? []);
        setRegs(data.registrations ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function restore(table: string, id: string) {
    setRestoring(id);
    const res = await fetch("/api/admin/system/trash", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table, id }),
    });
    if (res.ok) {
      if (table === "events") {
        setEvents(prev => prev.filter(e => e.id !== id));
      } else {
        setRegs(prev => prev.filter(r => r.id !== id));
      }
    }
    setRestoring(null);
  }

  const tabs: { key: Tab; label: string; icon: typeof Calendar; count: number }[] = [
    { key: "events",        label: "Events",       icon: Calendar, count: events.length },
    { key: "registrations", label: "Registrants",  icon: Users,    count: registrations.length },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-forest">Trash</h1>
          <p className="text-sm text-charcoal/50 mt-1">Soft-deleted items — restore or leave to expire</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-charcoal/40 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2">
          <Trash2 size={12} className="text-yellow-600" />
          <span>Items here are not permanently deleted</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-off-white rounded-xl p-1 w-fit mb-6">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key
                ? "bg-white text-forest shadow-sm"
                : "text-charcoal/50 hover:text-charcoal"
            }`}
          >
            <Icon size={14} />
            {label}
            {count > 0 && (
              <span className="bg-forest/10 text-forest text-xs rounded-full px-1.5 py-0.5">{count}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-mist p-8 text-center">
          <p className="text-sm text-charcoal/40">Loading...</p>
        </div>
      ) : tab === "events" ? (
        events.length === 0 ? (
          <EmptyState label="No deleted events" />
        ) : (
          <div className="bg-white rounded-2xl border border-mist overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mist bg-off-white">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal/50 uppercase tracking-wider">Event</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal/50 uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal/50 uppercase tracking-wider">Deleted</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-mist/60">
                {events.map(ev => (
                  <tr key={ev.id} className="hover:bg-off-white/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-charcoal/80">{ev.title}</td>
                    <td className="px-4 py-3 text-charcoal/50 text-xs">
                      {new Date(ev.event_date).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                    </td>
                    <td className="px-4 py-3 text-charcoal/40 text-xs">
                      {new Date(ev.deleted_at).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => restore("events", ev.id)}
                        disabled={restoring === ev.id}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-forest hover:underline disabled:opacity-50"
                      >
                        <RotateCcw size={12} />
                        {restoring === ev.id ? "Restoring…" : "Restore"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        registrations.length === 0 ? (
          <EmptyState label="No deleted registrations" />
        ) : (
          <div className="bg-white rounded-2xl border border-mist overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mist bg-off-white">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal/50 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal/50 uppercase tracking-wider">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal/50 uppercase tracking-wider">Event</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal/50 uppercase tracking-wider">Deleted</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-mist/60">
                {registrations.map(r => (
                  <tr key={r.id} className="hover:bg-off-white/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-charcoal/80">{r.first_name} {r.last_name}</td>
                    <td className="px-4 py-3 text-charcoal/50 text-xs">{r.email ?? r.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-charcoal/50 text-xs">
                      {(r.events as { title: string } | null)?.title ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-charcoal/40 text-xs">
                      {new Date(r.deleted_at).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => restore("registrations", r.id)}
                        disabled={restoring === r.id}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-forest hover:underline disabled:opacity-50"
                      >
                        <RotateCcw size={12} />
                        {restoring === r.id ? "Restoring…" : "Restore"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="bg-white rounded-2xl border border-mist p-12 text-center">
      <Trash2 size={24} className="mx-auto text-charcoal/20 mb-3" />
      <p className="text-sm text-charcoal/50">{label}</p>
    </div>
  );
}
