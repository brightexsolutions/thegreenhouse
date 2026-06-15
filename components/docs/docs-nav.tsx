"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { SECTIONS } from "@/components/docs/docs-shared";

interface Props {
  /** ID of the scrollable container. Omit to observe against the viewport (public docs). */
  scrollContainerId?: string;
}

export function DocsNav({ scrollContainerId }: Props) {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0]?.id ?? "");

  useEffect(() => {
    const root = scrollContainerId
      ? document.getElementById(scrollContainerId)
      : null;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      {
        root,
        rootMargin: "-8% 0px -78% 0px",
        threshold: 0,
      }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [scrollContainerId]);

  return (
    <div className="space-y-0.5">
      {SECTIONS.map(({ id, icon: Icon, title, color }) => {
        const active = activeId === id;
        return (
          <a
            key={id}
            href={`#${id}`}
            className={cn(
              "group flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all",
              active
                ? "text-forest bg-forest/8 font-medium"
                : "text-charcoal/55 hover:text-forest hover:bg-forest/5"
            )}
          >
            <div
              className={cn(
                "w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-opacity",
                color,
                active ? "opacity-100" : "opacity-60 group-hover:opacity-100"
              )}
            >
              <Icon size={10} />
            </div>
            <span className="leading-tight flex-1">{title}</span>
            {active && (
              <span className="w-1.5 h-1.5 rounded-full bg-forest flex-shrink-0" />
            )}
          </a>
        );
      })}
    </div>
  );
}
