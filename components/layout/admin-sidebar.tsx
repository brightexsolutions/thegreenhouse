"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, CalendarDays, Users, MessageSquare,
  Settings2, BookOpen, Leaf, Shield, FileText, Trash2,
  UserCog, Radio, ExternalLink, Library, Inbox,
} from "lucide-react";

const NAV = [
  { href: "/admin/dashboard",      icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/events",         icon: CalendarDays,    label: "Events" },
  { href: "/admin/registrants",    icon: Users,           label: "Registrants" },
  { href: "/admin/library",        icon: Library,         label: "Library" },
  { href: "/admin/communications", icon: MessageSquare,   label: "Comms" },
  { href: "/admin/enquiries",      icon: Inbox,           label: "Enquiries" },
  { href: "/admin/docs",           icon: BookOpen,        label: "Docs" },
];

const SYSTEM_NAV = [
  { href: "/admin/system",          icon: Shield,    label: "System" },
  { href: "/admin/system/logs",     icon: FileText,  label: "Logs" },
  { href: "/admin/system/trash",    icon: Trash2,    label: "Trash" },
  { href: "/admin/system/admins",   icon: UserCog,   label: "Admins" },
  { href: "/admin/system/settings", icon: Settings2, label: "Settings" },
];

interface AdminSidebarProps {
  role:      string;
  liveSlug?: string | null;
  liveName?: string | null;
}

export function AdminSidebar({ role, liveSlug, liveName }: AdminSidebarProps) {
  const pathname = usePathname();
  const [pending, setPending] = useState<string | null>(null);

  // Clear pending state once the pathname actually changes
  useEffect(() => { setPending(null); }, [pathname]);

  function isActive(href: string) {
    if (href === "/admin/dashboard") return pathname === href;
    return pathname.startsWith(href);
  }

  function handleNav(href: string) {
    if (!isActive(href)) setPending(href);
  }

  return (
    <aside className="h-full w-56 bg-forest flex flex-col flex-shrink-0 border-r border-cream/5">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-cream/8">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gold/20 flex items-center justify-center">
            <Leaf size={13} className="text-gold" />
          </div>
          <div>
            <span className="text-cream font-semibold text-sm block leading-none">The Green House</span>
            <span className="text-cream/30 text-[9px] mt-0.5 block">Admin</span>
          </div>
        </Link>
      </div>

      {/* Live event banner */}
      {liveSlug && (
        <div className="mx-3 mt-3 rounded-xl bg-green-600/20 border border-green-500/25 px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Radio size={10} className="text-green-400 animate-pulse" />
            <span className="text-[9px] font-bold text-green-400 uppercase tracking-wider">Live now</span>
          </div>
          {liveName && <p className="text-[10px] text-cream/55 truncate mb-1.5">{liveName}</p>}
          <Link
            href={`/live/${liveSlug}/control`}
            className="flex items-center gap-1 text-[10px] font-semibold text-green-300 hover:text-green-200 transition-colors"
          >
            Control panel <ExternalLink size={9} />
          </Link>
        </div>
      )}

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active  = isActive(href);
          const loading = pending === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => handleNav(href)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                active   ? "bg-gold/20 text-gold"
                : loading ? "bg-cream/15 text-cream"
                :           "text-cream/75 hover:text-cream hover:bg-cream/10"
              )}
            >
              {loading
                ? <span className="w-4 h-4 rounded-full border-2 border-cream/30 border-t-cream animate-spin flex-shrink-0" />
                : <Icon size={16} className="flex-shrink-0" />}
              <span>{label}</span>
            </Link>
          );
        })}

        {role === "super_admin" && (
          <>
            <div className="px-3 pt-5 pb-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-cream/35">System</span>
            </div>
            {SYSTEM_NAV.map(({ href, icon: Icon, label }) => {
              const active  = isActive(href);
              const loading = pending === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => handleNav(href)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                    active   ? "bg-gold/20 text-gold"
                    : loading ? "bg-cream/15 text-cream"
                    :           "text-cream/60 hover:text-cream hover:bg-cream/10"
                  )}
                >
                  {loading
                    ? <span className="w-4 h-4 rounded-full border-2 border-cream/30 border-t-cream animate-spin flex-shrink-0" />
                    : <Icon size={16} className="flex-shrink-0" />}
                  <span>{label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* View site */}
      <div className="px-3 py-3 border-t border-cream/8">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2.5 text-[11px] text-cream/35 hover:text-cream/65 transition-colors px-3 py-2 rounded-xl hover:bg-cream/5"
        >
          <ExternalLink size={12} />
          <span>View public site</span>
        </Link>
      </div>
    </aside>
  );
}
