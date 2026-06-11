import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { SessionManager } from "@/components/admin/session-manager";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

async function getEventWithSessions(id: string) {
  const supabase = createAdminClient();
  const [{ data: event }, { data: sessions }] = await Promise.all([
    supabase.from("events").select("id, title, status").eq("id", id).single(),
    supabase
      .from("event_sessions")
      .select("id, title, type, duration_min, notes, sort_order, trivia_question_id, trivia_questions(id, question, category), session_songs(id, sort_order, vocalist, item_type, item_text, songs(id, title, artist, lyrics))")
      .eq("event_id", id)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
  ]);
  return { event, sessions: sessions ?? [] };
}

export default async function SessionsPage({ params }: Props) {
  const { id } = await params;
  const { event, sessions } = await getEventWithSessions(id);
  if (!event) notFound();

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <p className="text-xs font-medium text-charcoal/40 uppercase tracking-wider mb-1">
          {(event as { title: string }).title}
        </p>
        <h1 className="text-2xl font-semibold text-forest">Program & Lyrics</h1>
        <p className="text-sm text-charcoal/50 mt-1">Manage the evening&apos;s program and song lyrics</p>
      </div>

      <SessionManager eventId={id} initialSessions={sessions as unknown as Parameters<typeof SessionManager>[0]["initialSessions"]} />
    </div>
  );
}
