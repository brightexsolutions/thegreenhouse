import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { SITE_NAME, SITE_URL, COMMS_FROM_EMAIL } from "@/lib/constants";

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

  const cookieSupa = await createClient();
  const { data: { user } } = await cookieSupa.auth.getUser();

  const { data: admins } = await supabase
    .from("admin_profiles")
    .select("id, full_name, avatar_url, role, created_at")
    .order("created_at", { ascending: true });

  return NextResponse.json({ admins: admins ?? [], currentUserId: user?.id ?? null });
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

  // Send password-reset / invite email so the new admin can set their password
  try {
    const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
      type:  "recovery",
      email,
      options: { redirectTo: `${SITE_URL}/admin/login` },
    });

    const resetLink = (linkData as { properties?: { action_link?: string } })?.properties?.action_link;

    if (resetLink) {
      const resend = new Resend(process.env.RESEND_API_KEY ?? "");
      const firstName = (full_name ?? email).split(" ")[0];
      await resend.emails.send({
        from:    COMMS_FROM_EMAIL(),
        to:      email,
        subject: `You've been added as an admin on ${SITE_NAME}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1a18;">
            <p style="font-size:22px;font-weight:600;margin-bottom:8px;">Welcome to ${SITE_NAME} 👋</p>
            <p style="color:#555;margin-bottom:24px;">Hi ${firstName}, you've been added as a <strong>${role === "super_admin" ? "Super Admin" : "Admin"}</strong> on the ${SITE_NAME} platform.</p>
            <p style="color:#555;margin-bottom:24px;">Click the button below to set your password and access the admin panel:</p>
            <a href="${resetLink}"
               style="display:inline-block;background:#1b3a2a;color:#f7f2e8;padding:12px 28px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px;">
              Set my password →
            </a>
            <p style="color:#999;font-size:12px;margin-top:32px;">This link expires in 24 hours. If you did not expect this, you can ignore it.</p>
            <p style="color:#ccc;font-size:11px;margin-top:8px;">${SITE_URL}</p>
          </div>
        `,
      });
    }
  } catch { /* email is a best-effort — don't fail the whole request */ }

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
