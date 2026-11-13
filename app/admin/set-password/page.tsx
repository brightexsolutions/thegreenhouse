"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, KeyRound, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const MIN_LENGTH = 8;

/**
 * Where an invited admin lands after following the link in their invite
 * email. They are already signed in by then (/auth/confirm verified the
 * link), but their account was created with a random password nobody knows,
 * so this is the only place they can choose one.
 */
export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [show,     setShow]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(
        /session/i.test(updateError.message)
          ? "Your link has expired. Ask a super admin to send you a new invite."
          : updateError.message
      );
      setLoading(false);
      return;
    }

    router.push("/admin/dashboard");
    router.refresh();
  }

  const inputCls =
    "w-full px-4 py-3 rounded-2xl border border-mist bg-off-white text-sm text-charcoal placeholder:text-charcoal/50 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40 transition-all pr-11";

  return (
    <div className="flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gold/15 border border-gold/20 flex items-center justify-center mx-auto mb-4">
            <KeyRound size={20} className="text-gold" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-forest">Set your password</h1>
          <p className="text-charcoal/70 text-sm mt-1">
            Choose a password for signing in to the admin panel.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-cream rounded-3xl p-8 shadow-2xl space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="new-password" className="text-xs font-semibold text-charcoal/70">New password</label>
            <div className="relative">
              <input
                id="new-password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={MIN_LENGTH}
                required
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/65 hover:text-charcoal/65 transition-colors"
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="text-[11px] text-charcoal/65">At least {MIN_LENGTH} characters.</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm-password" className="text-xs font-semibold text-charcoal/70">Confirm password</label>
            <input
              id="confirm-password"
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              minLength={MIN_LENGTH}
              required
              className={inputCls}
            />
          </div>

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded bg-forest text-cream text-sm font-semibold hover:bg-moss transition-all duration-200 disabled:opacity-60"
          >
            {loading ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save password"}
          </button>
        </form>
      </div>
    </div>
  );
}
