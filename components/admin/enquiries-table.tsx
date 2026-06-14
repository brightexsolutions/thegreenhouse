"use client";

import { useRef, useState, useMemo } from "react";
import { Mail, Phone } from "lucide-react";

type FilterKey = "all" | "partner" | "give" | "other";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all",     label: "All" },
  { key: "partner", label: "Partnership" },
  { key: "give",    label: "Support" },
  { key: "other",   label: "Other" },
];

const INTEREST_LABELS: Record<string, string> = {
  worship_team:   "Worship team",
  host_venue:     "Host a venue",
  vision_carrier: "Vision Carrier",
  creative_team:  "Creative team",
  partner:        "Partnership",
  give:           "Financial support",
  attend:         "Attend sessions",
  other:          "Other",
};

const INTEREST_COLORS: Record<string, string> = {
  partner:        "bg-gold/15 text-[#8a6a1a] border-gold/25",
  give:           "bg-blue-50 text-blue-700 border-blue-200",
  worship_team:   "bg-forest/8 text-forest border-forest/15",
  creative_team:  "bg-purple-50 text-purple-700 border-purple-200",
  host_venue:     "bg-orange-50 text-orange-700 border-orange-200",
  vision_carrier: "bg-moss/10 text-moss border-moss/20",
  attend:         "bg-gray-50 text-gray-600 border-gray-200",
  other:          "bg-gray-50 text-gray-500 border-gray-200",
};

type Enquiry = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  interest: string;
  partner_type: string | null;
  message: string | null;
  created_at: string;
};

export function EnquiriesTable({ enquiries }: { enquiries: Enquiry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled]   = useState(false);
  const [filter, setFilter]       = useState<FilterKey>("all");

  function handleScroll() {
    setScrolled((scrollRef.current?.scrollTop ?? 0) > 0);
  }

  const counts = useMemo(() => ({
    all:     enquiries.length,
    partner: enquiries.filter(e => e.interest === "partner").length,
    give:    enquiries.filter(e => e.interest === "give").length,
    other:   enquiries.filter(e => e.interest !== "partner" && e.interest !== "give").length,
  }), [enquiries]);

  const visible = useMemo(() => {
    if (filter === "all")     return enquiries;
    if (filter === "partner") return enquiries.filter(e => e.interest === "partner");
    if (filter === "give")    return enquiries.filter(e => e.interest === "give");
    return enquiries.filter(e => e.interest !== "partner" && e.interest !== "give");
  }, [enquiries, filter]);

  return (
    <>
      {/* Filter tabs */}
      <div className="flex items-center gap-1 px-4 pt-3.5 pb-0 border-b border-mist flex-shrink-0">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setFilter(key); scrollRef.current?.scrollTo(0, 0); }}
            className={`relative px-3.5 py-2 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap
              ${filter === key
                ? "text-forest bg-forest/5"
                : "text-charcoal/45 hover:text-charcoal/70 hover:bg-charcoal/4"
              }`}
          >
            {label}
            <span className={`ml-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full
              ${filter === key ? "bg-forest/12 text-forest" : "bg-charcoal/6 text-charcoal/35"}`}>
              {counts[key]}
            </span>
            {filter === key && (
              <span className="absolute bottom-0 inset-x-0 h-[2px] bg-forest rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="overflow-y-auto flex-1"
      >
      <table className="w-full">
        <thead
          className={`sticky top-0 bg-white transition-shadow duration-150 ${
            scrolled
              ? "shadow-[0_1px_0_0_#e5e7eb,0_2px_8px_0_rgba(0,0,0,0.06)]"
              : "border-b border-mist"
          }`}
        >
          <tr>
            <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-charcoal/40 px-5 py-3.5">Person</th>
            <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-charcoal/40 px-4 py-3.5">Interest</th>
            <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-charcoal/40 px-4 py-3.5 hidden md:table-cell">Message</th>
            <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-charcoal/40 px-4 py-3.5">Reply</th>
            <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-charcoal/40 px-4 py-3.5 whitespace-nowrap">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-mist">
          {visible.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-5 py-14 text-center text-sm text-charcoal/30">
                No {filter === "all" ? "" : FILTERS.find(f => f.key === filter)?.label.toLowerCase() + " "}enquiries yet
              </td>
            </tr>
          ) : null}
          {visible.map((e) => {
            const colorClass = INTEREST_COLORS[e.interest] ?? "bg-gray-50 text-gray-500 border-gray-200";
            const label      = INTEREST_LABELS[e.interest] ?? e.interest;
            const isPartner  = e.interest === "partner";

            return (
              <tr key={e.id} className={`group hover:bg-off-white transition-colors ${isPartner ? "bg-gold/[0.03]" : ""}`}>
                {/* Person */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-forest/8 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-forest uppercase">
                        {e.full_name.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-charcoal truncate max-w-[160px]">
                        {e.full_name}
                        {isPartner && (
                          <span className="ml-1.5 text-[9px] bg-gold/15 text-[#8a6a1a] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                            Partner
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-charcoal/35 truncate max-w-[160px] mt-0.5">
                        {e.email ?? e.phone ?? "—"}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Interest */}
                <td className="px-4 py-4">
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-semibold whitespace-nowrap ${colorClass}`}>
                      {label}
                    </span>
                    {e.partner_type && (
                      <p className="text-[10px] text-charcoal/40 mt-1.5 max-w-[140px] truncate">{e.partner_type}</p>
                    )}
                  </div>
                </td>

                {/* Message — clamped to 2 lines; full text on hover via title */}
                <td className="px-4 py-4 hidden md:table-cell max-w-[260px]">
                  {e.message ? (
                    <p
                      title={e.message}
                      className="text-xs text-charcoal/55 leading-relaxed line-clamp-2 cursor-default"
                    >
                      {e.message}
                    </p>
                  ) : (
                    <span className="text-[10px] text-charcoal/20">—</span>
                  )}
                </td>

                {/* Reply actions */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    {e.email && (
                      <a
                        href={`mailto:${e.email}`}
                        className="w-7 h-7 rounded-lg bg-forest/8 hover:bg-forest/15 flex items-center justify-center text-forest/70 hover:text-forest transition-colors"
                        title={`Email ${e.full_name}`}
                      >
                        <Mail size={12} />
                      </a>
                    )}
                    {e.phone && (
                      <a
                        href={`https://wa.me/${e.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 flex items-center justify-center text-[#128C4F] transition-colors"
                        title={`WhatsApp ${e.full_name}`}
                      >
                        <Phone size={12} />
                      </a>
                    )}
                  </div>
                </td>

                {/* Date */}
                <td className="px-4 py-4 text-right">
                  <p className="text-[10px] text-charcoal/40 whitespace-nowrap">
                    {new Date(e.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "2-digit" })}
                  </p>
                  <p className="text-[9px] text-charcoal/25 mt-0.5">
                    {new Date(e.created_at).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: true })}
                  </p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </>
  );
}
