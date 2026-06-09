import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { ExportPdf } from "@/lib/pdf/export-pdf";

type Props = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const format = req.nextUrl.searchParams.get("format") ?? "csv";
  const adminSupa = createAdminClient();

  const { data: event } = await adminSupa
    .from("events")
    .select("title, event_date")
    .eq("id", id)
    .single();

  const { data: rows } = await adminSupa
    .from("registrations")
    .select("first_name, last_name, email, phone, role, created_at, checked_in")
    .eq("event_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  const registrants = (rows as Array<{
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    role: string;
    created_at: string;
    checked_in: boolean;
  }>) ?? [];

  if (format === "csv") {
    const header = "First Name,Last Name,Email,Phone,Role,Registered At,Attended";
    const lines = registrants.map((r) =>
      [
        r.first_name,
        r.last_name,
        r.email ?? "",
        r.phone ?? "",
        r.role,
        new Date(r.created_at).toLocaleDateString("en-KE"),
        r.checked_in ? "Yes" : "No",
      ]
        .map((v) => `"${v.replace(/"/g, '""')}"`)
        .join(",")
    );

    const csv = [header, ...lines].join("\n");
    const eventSlug = (event as { title: string } | null)?.title?.toLowerCase().replace(/\s+/g, "-") ?? id;

    return new NextResponse(csv, {
      headers: {
        "Content-Type":        "text/csv",
        "Content-Disposition": `attachment; filename="registrants-${eventSlug}.csv"`,
      },
    });
  }

  // PDF export
  const pdfBuffer = await renderToBuffer(
    // @ts-expect-error react-pdf uses a different JSX type
    createElement(ExportPdf, {
      eventTitle: (event as { title: string; event_date: string } | null)?.title ?? "Event",
      eventDate:  new Date((event as { title: string; event_date: string } | null)?.event_date ?? "").toLocaleDateString("en-KE"),
      registrants,
    })
  );

  return new NextResponse(Buffer.from(pdfBuffer) as unknown as BodyInit, {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="registrants-${id}.pdf"`,
    },
  });
}
