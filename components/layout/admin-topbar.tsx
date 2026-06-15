"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { LogOut, User, RefreshCw, Menu } from "lucide-react";

interface AdminTopbarProps {
  fullName:    string;
  role:        string;
  onMenuOpen?: () => void;
}

export function AdminTopbar({ fullName, role, onMenuOpen }: AdminTopbarProps) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh server data when the tab regains visibility
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") router.refresh();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [router]);

  async function handleRefresh() {
    setRefreshing(true);
    router.refresh();
    // Give the refresh a moment to complete before clearing the spinner
    setTimeout(() => setRefreshing(false), 800);
  }

  async function handleSignOut() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="h-14 border-b border-mist bg-white flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
      {/* Hamburger — mobile only */}
      {onMenuOpen && (
        <button
          onClick={onMenuOpen}
          className="md:hidden w-8 h-8 rounded-lg border border-mist flex items-center justify-center text-charcoal/50 hover:text-charcoal hover:border-charcoal/20 transition-all"
          aria-label="Open menu"
        >
          <Menu size={15} />
        </button>
      )}
      {/* Spacer on desktop (keeps right-side items right-aligned) */}
      <div className="hidden md:block" />

      <div className="flex items-center gap-2">
        {/* Manual refresh */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="w-8 h-8 rounded-lg border border-mist flex items-center justify-center text-charcoal/40 hover:text-forest hover:border-forest/30 transition-all disabled:opacity-50"
          title="Refresh data"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
        </button>

        <div className="flex items-center gap-2 pl-1">
          <div className="w-7 h-7 rounded-full bg-forest/10 flex items-center justify-center">
            <User size={13} className="text-forest" />
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-charcoal leading-none">{fullName}</p>
            <p className="text-[10px] text-charcoal/40 mt-0.5 capitalize">{role.replace("_", " ")}</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-8 h-8 rounded-lg border border-mist flex items-center justify-center text-charcoal/40 hover:text-charcoal hover:border-charcoal/20 transition-all"
          title="Sign out"
        >
          <LogOut size={13} />
        </button>
      </div>
    </header>
  );
}
