import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: event } = await supabase
    .from("events")
    .select("feedback_url")
    .eq("slug", slug)
    .single();

  const url = (event as { feedback_url: string | null } | null)?.feedback_url;
  if (!url) return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL ?? "https://thegreenhouseke.com"));

  return NextResponse.redirect(url, 302);
}
