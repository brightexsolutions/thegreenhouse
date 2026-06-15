"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileText, MessageSquare, Music2, Users, Wrench } from "lucide-react";

const TABS = [
  { href: (id: string) => `/admin/events/${id}`,             label: "Details",     icon: FileText,      exact: true  },
  { href: (id: string) => `/admin/events/${id}/sessions`,    label: "Program",     icon: Music2,        exact: false },
  { href: (id: string) => `/admin/events/${id}/registrants`, label: "Registrants", icon: Users,         exact: false },
  { href: (id: string) => `/admin/events/${id}/feedback`,    label: "Feedback",    icon: MessageSquare, exact: false },
  { href: (id: string) => `/admin/events/${id}/tools`,       label: "Tools",       icon: Wrench,        exact: false },
];

export function EventTabBar({ eventId }: { eventId: string }) {
  const pathname = usePathname();

  return (
    <div className="overflow-x-auto mt-3 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex items-center gap-1 bg-white rounded-2xl border border-mist p-1 w-max">
        {TABS.map(({ href, label, icon: Icon, exact }) => {
          const to     = href(eventId);
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={to}
              href={to}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                active
                  ? "bg-forest text-cream shadow-sm"
                  : "text-charcoal/50 hover:text-charcoal hover:bg-charcoal/5"
              )}
            >
              <Icon size={13} />
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
