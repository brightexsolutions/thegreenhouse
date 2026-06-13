import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function guard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? createAdminClient() : null;
}

type Props = { params: Promise<{ id: string }> };

const VALID_PERMISSIONS = ["full", "music", "scenes", "trivia", "feedback"] as const;
type Permission = typeof VALID_PERMISSIONS[number];

export async function GET(_req: NextRequest, { params }: Props) {
  const { id } = await params;
  const supabase = await guard();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("control_links")
    .select("id, label, permissions, token, created_at")
    .eq("event_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ links: data ?? [] });
}

export async function POST(req: NextRequest, { params }: Props) {
  const { id } = await params;
  const supabase = await guard();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { label, permissions } = await req.json() as {
    label?: string;
    permissions?: string[];
  };

  if (!label?.trim()) {
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  }

  const validPerms = (permissions ?? ["full"]).filter(
    (p): p is Permission => VALID_PERMISSIONS.includes(p as Permission)
  );
  if (validPerms.length === 0) {
    return NextResponse.json({ error: "at least one valid permission required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("control_links")
    .insert({ event_id: id, label: label.trim(), permissions: validPerms })
    .select("id, label, permissions, token, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ link: data }, { status: 201 });
}
