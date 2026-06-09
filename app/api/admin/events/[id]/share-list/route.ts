import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { SITE_NAME } from "@/lib/constants";

type Props = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { email } = await req.json();

  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const adminSupa = createAdminClient();

  const { data: event } = await adminSupa
    .from("events")
    .select("title, event_date")
    .eq("id", id)
    .single();

  const { data: rows } = await adminSupa
    .from("registrations")
    .select("first_name, last_name, email, phone, role, checked_in, created_at")
    .eq("event_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  const registrants = (rows as Array<{
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    role: string;
    checked_in: boolean;
    created_at: string;
  }>) ?? [];

  const header = "First Name,Last Name,Email,Phone,Role,Registered At,Attended";
  const lines = registrants.map((r) =>
    [r.first_name, r.last_name, r.email ?? "", r.phone ?? "", r.role,
     new Date(r.created_at).toLocaleDateString("en-KE"), r.checked_in ? "Yes" : "No"]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = Buffer.from([header, ...lines].join("\n"));

  const resend = new Resend(process.env.RESEND_API_KEY);
  const eventTitle = (event as { title: string; event_date: string } | null)?.title ?? "Event";
  const eventDate  = new Date((event as { title: string; event_date: string } | null)?.event_date ?? "").toLocaleDateString("en-KE");

  await resend.emails.send({
    from:    `${SITE_NAME} <admin@thegreenhouseke.com>`,
    to:      [email],
    subject: `Registrant list — ${eventTitle}`,
    text:    `Attached is the registrant list for ${eventTitle} (${eventDate}). ${registrants.length} registrant(s).`,
    attachments: [{ filename: "registrants.csv", content: csv }],
  });

  return NextResponse.json({ success: true });
}
