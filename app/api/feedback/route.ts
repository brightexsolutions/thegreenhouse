import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  event_id: z.string().uuid(),
  name:     z.string().max(80).optional(),
  message:  z.string().min(3).max(280),
  attended: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("feedback_submissions")
    .insert({
      event_id: parsed.data.event_id,
      name:     parsed.data.name || null,
      message:  parsed.data.message,
      attended: parsed.data.attended,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ submitted: true }, { status: 201 });
}
