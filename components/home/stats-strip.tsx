"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { SESSION_FREQUENCY } from "@/lib/constants";

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = performance.now();
    function step(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      // cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [inView, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {value}{suffix}
    </span>
  );
}

function buildStats(entryDisplay: string) {
  return [
    { label: "Sessions",  value: 2,    suffix: "", display: null },
    { label: "Frequency", value: null, suffix: "", display: SESSION_FREQUENCY.charAt(0).toUpperCase() + SESSION_FREQUENCY.slice(1) },
    { label: "Duration",  value: null, suffix: "", display: "2–3 hrs" },
    { label: "Entry",     value: null, suffix: "", display: entryDisplay },
  ];
}

export function StatsStrip({ entryDisplay = "Free" }: { entryDisplay?: string }) {
  const stats = buildStats(entryDisplay);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-mist border-y border-mist">
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col items-center justify-center py-7 px-4 gap-1">
          <span className="font-display text-3xl md:text-4xl font-semibold text-forest">
            {s.value !== null ? <Counter target={s.value} suffix={s.suffix} /> : s.display}
          </span>
          <span className="label-caps text-charcoal/40">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
