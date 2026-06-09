"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  MessageSquare,
  Settings2,
  BookOpen,
  Leaf,
  Shield,
  FileText,
  Trash2,
  UserCog,
} from "lucide-react";

const NAV = [
  { href: "/admin/dashboard",       icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/events",          icon: CalendarDays,    label: "Events" },
  { href: "/admin/registrants",     icon: Users,           label: "Registrants" },
  { href: "/admin/communications",  icon: MessageSquare,   label: "Comms" },
  { href: "/admin/docs",            icon: BookOpen,        label: "Docs" },
];

const SYSTEM_NAV = [
  { href: "/admin/system",          icon: Shield,   label: "System" },
  { href: "/admin/system/logs",     icon: FileText, label: "Logs" },
  { href: "/admin/system/trash",    icon: Trash2,   label: "Trash" },
  { href: "/admin/system/admins",   icon: UserCog,  label: "Admins" },
  { href: "/admin/system/settings", icon: Settings2, label: "Settings" },
];

interface AdminSidebarProps {
  role: string;
}

export function AdminSidebar({ role }: AdminSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin/dashboard") return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-60 min-h-screen bg-forest flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-7 border-b border-cream/10">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gold/20 flex items-center justify-center">
            <Leaf size={14} className="text-gold" />
          </div>
          <span className="text-cream font-semibold text-sm">The Green House</span>
        </Link>
        <span className="text-cream/30 text-[10px] mt-1 block pl-9">Admin</span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150",
              isActive(href)
                ? "bg-gold/15 text-gold font-semibold"
                : "text-cream/60 hover:text-cream hover:bg-cream/5"
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}

        {/* System — super_admin only */}
        {role === "super_admin" && (
          <>
            <div className="px-3 pt-5 pb-1">
              <span className="text-[9px] label-caps text-cream/25">System</span>
            </div>
            {SYSTEM_NAV.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150",
                  isActive(href)
                    ? "bg-gold/15 text-gold font-semibold"
                    : "text-cream/50 hover:text-cream hover:bg-cream/5"
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* View site link */}
      <div className="px-4 py-4 border-t border-cream/10">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 text-xs text-cream/40 hover:text-cream/70 transition-colors px-3 py-2"
        >
          <span>↗</span>
          <span>View site</span>
        </Link>
      </div>
    </aside>
  );
}
