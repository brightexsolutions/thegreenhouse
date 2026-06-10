"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileText, Music2, Users, Wrench } from "lucide-react";

const TABS = [
  { href: (id: string) => `/admin/events/${id}`,             label: "Details",     icon: FileText, exact: true  },
  { href: (id: string) => `/admin/events/${id}/sessions`,    label: "Program",     icon: Music2,   exact: false },
  { href: (id: string) => `/admin/events/${id}/registrants`, label: "Registrants", icon: Users,    exact: false },
  { href: (id: string) => `/admin/events/${id}/tools`,       label: "Tools",       icon: Wrench,   exact: false },
];

export function EventTabBar({ eventId }: { eventId: string }) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 pt-3 -mb-px flex-shrink-0">
      {TABS.map(({ href, label, icon: Icon, exact }) => {
        const to     = href(eventId);
        const active = exact ? pathname === to : pathname.startsWith(to);
        return (
          <Link
            key={to}
            href={to}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-medium transition-all border-b-2 -mb-px",
              active
                ? "bg-white border-forest text-forest shadow-sm"
                : "border-transparent text-charcoal/50 hover:text-charcoal hover:bg-white/60"
            )}
          >
            <Icon size={13} />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
