import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";

async function guard() {
  const g = await requireAdmin();
  return g.ok ? g.supabase : null;
}

type Props = { params: Promise<{ id: string; linkId: string }> };

export async function DELETE(_req: NextRequest, { params }: Props) {
  const { id, linkId } = await params;
  const supabase = await guard();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("control_links")
    .delete()
    .eq("id", linkId)
    .eq("event_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
