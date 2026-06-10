import { cn } from "@/lib/utils";

type EventStatus = "draft" | "published" | "live" | "past" | "cancelled";

const STYLES: Record<EventStatus, string> = {
  draft:     "bg-charcoal/6 text-charcoal/40 border-charcoal/8",
  published: "bg-gold/10 text-amber-700 border-gold/25",
  live:      "bg-green-100 text-green-700 border-green-200",
  past:      "bg-charcoal/8 text-charcoal/50 border-charcoal/10",
  cancelled: "bg-red-50 text-red-600 border-red-100",
};

const DOTS: Record<EventStatus, string> = {
  draft:     "bg-charcoal/30",
  published: "bg-gold",
  live:      "bg-green-500 animate-pulse",
  past:      "bg-charcoal/30",
  cancelled: "bg-red-400",
};

export function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border font-semibold capitalize",
      STYLES[status] ?? STYLES.draft
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", DOTS[status] ?? DOTS.draft)} />
      {status}
    </span>
  );
}
