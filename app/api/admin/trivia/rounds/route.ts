import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// POST /api/admin/trivia/rounds — start a new trivia round
// Closes any existing active/revealing round for this event first
export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const { event_id, question_id, timer_seconds } = await req.json() as {
    event_id:      string;
    question_id:   string;
    timer_seconds?: number;
  };

  if (!event_id || !question_id)
    return NextResponse.json({ error: "event_id and question_id required" }, { status: 400 });

  // Close any open round for this event
  await supabase
    .from("trivia_rounds")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("event_id", event_id)
    .in("status", ["active", "revealing"]);

  // Create new round
  const { data: round, error } = await supabase
    .from("trivia_rounds")
    .insert({
      event_id,
      question_id,
      status:        "active",
      timer_seconds: timer_seconds ?? null,
      started_at:    new Date().toISOString(),
    })
    .select("id, status, started_at, timer_seconds, question_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update display_state: set scene to trivia + trivia_round_id
  await supabase
    .from("display_state")
    .update({
      scene:           "trivia",
      trivia_round_id: round.id,
      updated_at:      new Date().toISOString(),
    })
    .eq("event_id", event_id);

  return NextResponse.json({ round }, { status: 201 });
}
