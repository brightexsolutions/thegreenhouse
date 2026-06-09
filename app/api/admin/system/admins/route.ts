import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function guardSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const adminSupa = createAdminClient();
  const { data: profile } = await adminSupa
    .from("admin_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "super_admin" ? adminSupa : null;
}

export async function GET() {
  const supabase = await guardSuperAdmin();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: admins } = await supabase
    .from("admin_profiles")
    .select("id, full_name, avatar_url, role, created_at")
    .order("created_at", { ascending: true });

  return NextResponse.json({ admins: admins ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await guardSuperAdmin();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, full_name, role } = await req.json() as {
    email: string;
    full_name?: string;
    role: "admin" | "super_admin";
  };

  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const supabaseAdmin = createAdminClient();

  const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
  const existing = existingUser?.users.find(u => u.email === email);

  let userId: string;

  if (existing) {
    userId = existing.id;
  } else {
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      password: crypto.randomUUID(),
      user_metadata: { full_name: full_name ?? "" },
    });
    if (createErr || !newUser.user) {
      return NextResponse.json({ error: createErr?.message ?? "Failed to create user" }, { status: 500 });
    }
    userId = newUser.user.id;
  }

  const { error: profileErr } = await supabase
    .from("admin_profiles")
    .upsert({ id: userId, full_name: full_name ?? null, role }, { onConflict: "id" });

  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const supabase = await guardSuperAdmin();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, role } = await req.json() as { id: string; role: "admin" | "super_admin" };
  const { error } = await supabase.from("admin_profiles").update({ role }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ updated: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await guardSuperAdmin();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json() as { id: string };
  const { error } = await supabase.from("admin_profiles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
