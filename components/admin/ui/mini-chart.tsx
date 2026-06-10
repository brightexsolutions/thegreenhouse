"use client";

import { cn } from "@/lib/utils";

type Accent = "green" | "gold" | "blue" | "red" | "purple";

const COLORS: Record<Accent, { stroke: string; fill: string }> = {
  green:  { stroke: "#1b3a2a", fill: "rgba(27,58,42,0.08)" },
  gold:   { stroke: "#c9a24a", fill: "rgba(201,162,74,0.1)" },
  blue:   { stroke: "#3b82f6", fill: "rgba(59,130,246,0.08)" },
  red:    { stroke: "#ef4444", fill: "rgba(239,68,68,0.08)" },
  purple: { stroke: "#a855f7", fill: "rgba(168,85,247,0.08)" },
};

interface MiniChartProps {
  data:       number[];
  color?:     Accent;
  width?:     number;
  height?:    number;
  className?: string;
}

export function MiniChart({ data, color = "green", width = 72, height = 32, className }: MiniChartProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const step = w / (data.length - 1);

  const pts = data.map((v, i) => [pad + i * step, pad + h - ((v - min) / range) * h] as [number, number]);
  const pathD = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const areaD = `${pathD} L ${pts[pts.length - 1][0].toFixed(1)} ${(pad + h).toFixed(1)} L ${pts[0][0].toFixed(1)} ${(pad + h).toFixed(1)} Z`;

  const c = COLORS[color];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("flex-shrink-0", className)}
      aria-hidden
    >
      <path d={areaD} fill={c.fill} />
      <path d={pathD} fill="none" stroke={c.stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2" fill={c.stroke} />
    </svg>
  );
}
