import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { MessageSquare, UserCheck, UserX } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EventFeedbackPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!event) notFound();

  const { data: submissions } = await supabase
    .from("feedback_submissions")
    .select("id, name, message, attended, created_at")
    .eq("event_id", id)
    .order("created_at", { ascending: false });

  const list = submissions ?? [];
  const attendedCount = list.filter(s => s.attended).length;
  const missedCount   = list.filter(s => !s.attended).length;

  return (
    <div className="flex flex-col gap-5">

      {/* Summary row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest/8 text-forest text-xs font-medium">
          <MessageSquare size={11} />
          {list.length} response{list.length !== 1 ? "s" : ""}
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
          <UserCheck size={11} />
          {attendedCount} attended
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
          <UserX size={11} />
          {missedCount} couldn&apos;t make it
        </div>
      </div>

      {/* Feedback list */}
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MessageSquare size={28} className="text-charcoal/20 mb-3" />
          <p className="text-sm text-charcoal/40">No feedback submitted yet</p>
          <p className="text-xs text-charcoal/30 mt-1">Responses will appear here as attendees submit them</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {list.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-mist p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-charcoal leading-relaxed">{item.message}</p>
                </div>
                <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium ${item.attended ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {item.attended ? "Attended" : "Didn't attend"}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-mist">
                <span className="text-xs text-charcoal/40">
                  {item.name ?? <span className="italic">Anonymous</span>}
                </span>
                <span className="text-charcoal/20">·</span>
                <span className="text-xs text-charcoal/30">
                  {new Date(item.created_at).toLocaleDateString("en-KE", {
                    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
