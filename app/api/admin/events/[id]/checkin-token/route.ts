import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guard";
import { randomUUID } from "crypto";

type Props = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Props) {
  const { id } = await params;
  const g = await requireAdmin();
  if (!g.ok) return g.response;

  const token = randomUUID();
  const adminSupa = createAdminClient();

  const { error } = await adminSupa
    .from("events")
    .update({ checkin_token: token })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ token });
}
