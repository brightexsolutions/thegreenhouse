import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { renderMarkdown, extractHeadings } from "@/lib/blog";

export const dynamic = "force-dynamic";

/**
 * Render a draft through the same Markdown pipeline the public article page
 * uses. Doing this server-side rather than bundling a Markdown parser into
 * the admin client means preview and production can never drift apart, and
 * the editor stays light.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => null) as { content?: string } | null;
  const content = typeof body?.content === "string" ? body.content : "";

  if (content.length > 60_000) {
    return NextResponse.json({ error: "That draft is too long to preview." }, { status: 413 });
  }

  return NextResponse.json({
    html:     renderMarkdown(content),
    headings: extractHeadings(content),
  });
}
