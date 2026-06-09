import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const adminSupa = createAdminClient();

  const { data: event, error } = await adminSupa
    .from("events")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, slug")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(event);
}

export async function DELETE(req: NextRequest, { params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const adminSupa = createAdminClient();

  await adminSupa
    .from("events")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ success: true });
}
