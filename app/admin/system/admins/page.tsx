"use client";

import { useState, useEffect } from "react";
import { UserPlus, Trash2, ShieldCheck } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-dialog";

type AdminProfile = {
  id:         string;
  full_name:  string | null;
  avatar_url: string | null;
  role:       "admin" | "super_admin";
  created_at: string;
  email?:     string;
};

export default function AdminsPage() {
  const confirm = useConfirm();
  const [admins,  setAdmins]  = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding,  setAdding]  = useState(false);
  const [email,   setEmail]   = useState("");
  const [name,    setName]    = useState("");
  const [role,    setRole]    = useState<"admin" | "super_admin">("admin");
  const [msg,     setMsg]     = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [busy,    setBusy]    = useState<string | null>(null);

  // The current user's own ID — fetched so we never let them delete themselves
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/system/admins");
    if (res.ok) {
      const data = await res.json();
      setAdmins(data.admins ?? []);
      setCurrentUserId(data.currentUserId ?? null);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addAdmin(e: React.FormEvent) {
    e.preventDefault();
    setBusy("add");
    const res = await fetch("/api/admin/system/admins", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, full_name: name, role }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg({ type: "ok", text: `${name || email} added as ${role}` });
      setEmail(""); setName(""); setAdding(false);
      await load();
    } else {
      setMsg({ type: "err", text: data.error ?? "Failed to add admin" });
    }
    setBusy(null);
    setTimeout(() => setMsg(null), 4000);
  }

  async function changeRole(id: string, newRole: "admin" | "super_admin") {
    setBusy(id);
    await fetch("/api/admin/system/admins", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id, role: newRole }),
    });
    setAdmins(prev => prev.map(a => a.id === id ? { ...a, role: newRole } : a));
    setBusy(null);
  }

  async function removeAdmin(id: string, name: string | null) {
    const ok = await confirm({ title: `Remove ${name ?? "this admin"}?`, message: "They will immediately lose all admin access.", destructive: true });
    if (!ok) return;
    setBusy(id + "-del");
    await fetch("/api/admin/system/admins", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id }),
    });
    setAdmins(prev => prev.filter(a => a.id !== id));
    setBusy(null);
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-forest">Admin Accounts</h1>
          <p className="text-sm text-charcoal/50 mt-1">Manage who has access to this dashboard</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-cream text-sm font-medium hover:bg-moss transition-colors"
        >
          <UserPlus size={15} />
          Add admin
        </button>
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

      {/* Add admin form */}
      {adding && (
        <form onSubmit={addAdmin} className="bg-white rounded-2xl border border-forest/20 p-5 mb-6">
          <h3 className="text-sm font-semibold text-forest mb-4">New admin account</h3>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-charcoal/60 mb-1">Email *</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-mist text-sm focus:outline-none focus:border-forest"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal/60 mb-1">Full name</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-mist text-sm focus:outline-none focus:border-forest"
                placeholder="Jane Doe"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-charcoal/60 mb-1">Role</label>
            <select value={role} onChange={e => setRole(e.target.value as "admin" | "super_admin")}
              className="w-full sm:w-48 px-3 py-2 rounded-lg border border-mist text-sm focus:outline-none focus:border-forest">
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={busy === "add"}
              className="px-4 py-2 rounded-xl bg-forest text-cream text-sm font-medium disabled:opacity-50">
              {busy === "add" ? "Adding…" : "Add admin"}
            </button>
            <button type="button" onClick={() => setAdding(false)}
              className="px-4 py-2 rounded-xl border border-mist text-sm text-charcoal/60 hover:text-charcoal">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-mist p-8 text-center">
          <p className="text-sm text-charcoal/40">Loading...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-mist overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist bg-off-white">
                <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal/50 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal/50 uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-charcoal/50 uppercase tracking-wider">Added</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-mist/60">
              {admins.map(admin => {
                const isSuperAdmin = admin.role === "super_admin";
                const isSelf       = admin.id === currentUserId;
                const canDelete    = !isSuperAdmin && !isSelf;
                const canToggle    = !isSuperAdmin;

                return (
                  <tr key={admin.id} className="hover:bg-off-white/50 transition-colors">
                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-forest/10 flex items-center justify-center text-xs font-semibold text-forest flex-shrink-0">
                          {(admin.full_name ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-charcoal/80">{admin.full_name ?? "—"}</p>
                            {isSelf && (
                              <span className="text-[10px] text-charcoal/30 bg-mist px-1.5 py-0.5 rounded-full">you</span>
                            )}
                          </div>
                          {admin.email && <p className="text-xs text-charcoal/40">{admin.email}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      {isSuperAdmin ? (
                        /* Super admins get a static blue badge — not a select */
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                          <ShieldCheck size={11} />
                          Super Admin
                        </span>
                      ) : (
                        <select
                          value={admin.role}
                          onChange={e => changeRole(admin.id, e.target.value as "admin" | "super_admin")}
                          disabled={!canToggle || busy === admin.id}
                          className="text-xs border border-mist rounded-lg px-2 py-1 focus:outline-none focus:border-forest disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      )}
                    </td>

                    {/* Added date */}
                    <td className="px-4 py-3 text-charcoal/40 text-xs">
                      {new Date(admin.created_at).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      {canDelete ? (
                        <button
                          onClick={() => removeAdmin(admin.id, admin.full_name)}
                          disabled={busy === admin.id + "-del"}
                          className="p-1.5 rounded-lg text-charcoal/30 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Remove admin"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : (
                        <div className="w-7 h-7" /> /* placeholder to keep column width */
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
