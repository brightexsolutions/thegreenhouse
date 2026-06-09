"use client";

import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { LogOut, User } from "lucide-react";

interface AdminTopbarProps {
  fullName: string;
  role:     string;
}

export function AdminTopbar({ fullName, role }: AdminTopbarProps) {
  const router = useRouter();

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
    <header className="h-14 border-b border-mist bg-white flex items-center justify-between px-6 flex-shrink-0">
      <div />

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
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
