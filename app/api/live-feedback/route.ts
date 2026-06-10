import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as {
    event_id?: string;
    message?:  string;
    author_name?: string;
  };

  const { event_id, message, author_name } = body;

  if (!event_id || !message?.trim()) {
    return NextResponse.json({ error: "event_id and message are required" }, { status: 400 });
  }
  if (message.trim().length > 280) {
    return NextResponse.json({ error: "Message too long (max 280 characters)" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Verify the event exists and is active
  const { data: event } = await supabase
    .from("events")
    .select("id, status")
    .eq("id", event_id)
    .is("deleted_at", null)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  if (!["published", "live"].includes(event.status)) {
    return NextResponse.json({ error: "Feedback is not open for this event" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("live_feedback")
    .insert({
      event_id,
      message:     message.trim(),
      author_name: author_name?.trim() || null,
    })
    .select("id, message, author_name, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const event_id = searchParams.get("event_id");

  if (!event_id) {
    return NextResponse.json({ error: "event_id is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("live_feedback")
    .select("id, message, author_name, created_at")
    .eq("event_id", event_id)
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ feedback: data ?? [] });
}
