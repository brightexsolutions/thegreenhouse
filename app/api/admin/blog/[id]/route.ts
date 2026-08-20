import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth-guard";
import { slugify, readingMinutes, deriveExcerpt } from "@/lib/blog";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  title:            z.string().trim().min(3).max(160).optional(),
  content:          z.string().trim().min(1).optional(),
  slug:             z.string().trim().max(80).optional(),
  excerpt:          z.string().trim().max(320).optional().nullable(),
  cover_image:      z.string().trim().max(500).optional().nullable(),
  cover_alt:        z.string().trim().max(200).optional().nullable(),
  author_name:      z.string().trim().max(120).optional(),
  category:         z.enum(["reflection", "session-recap", "teaching", "community", "announcement"]).optional(),
  tags:             z.array(z.string().trim().min(1).max(40)).max(8).optional(),
  status:           z.enum(["draft", "published"]).optional(),
  meta_title:       z.string().trim().max(70).optional().nullable(),
  meta_description: z.string().trim().max(170).optional().nullable(),
});

async function uniqueSlug(supabase: SupabaseClient, base: string, excludeId: string): Promise<string> {
  const root = base || "post";
  let candidate = root;
  for (let n = 2; n < 100; n++) {
    const { data } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", candidate)
      .neq("id", excludeId)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `${root}-${n}`;
  }
  return `${root}-${Date.now()}`;
}

// GET /api/admin/blog/[id] — one post, drafts included
export async function GET(_req: NextRequest, { params }: Props) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const { data, error } = await guard.supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data)  return NextResponse.json({ error: "Post not found" }, { status: 404 });
  return NextResponse.json({ post: data });
}

// PATCH /api/admin/blog/[id] — update a post
export async function PATCH(req: NextRequest, { params }: Props) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { data: current } = await guard.supabase
    .from("blog_posts")
    .select("id, slug, status, published_at, content")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!current) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const existing = current as { slug: string; status: string; published_at: string | null; content: string };
  const d = parsed.data;
  const update: Record<string, unknown> = {};

  if (d.title !== undefined)            update.title = d.title;
  if (d.cover_image !== undefined)      update.cover_image = d.cover_image?.trim() || null;
  if (d.cover_alt !== undefined)        update.cover_alt = d.cover_alt?.trim() || null;
  if (d.author_name !== undefined)      update.author_name = d.author_name.trim() || "The Green House";
  if (d.category !== undefined)         update.category = d.category;
  if (d.tags !== undefined)             update.tags = d.tags;
  if (d.meta_title !== undefined)       update.meta_title = d.meta_title?.trim() || null;
  if (d.meta_description !== undefined) update.meta_description = d.meta_description?.trim() || null;

  if (d.content !== undefined) {
    update.content = d.content;
    update.reading_minutes = readingMinutes(d.content);
  }

  // An empty excerpt falls back to the derived one rather than going blank,
  // because it is what the search snippet and the index card both use.
  if (d.excerpt !== undefined) {
    update.excerpt = d.excerpt?.trim() || deriveExcerpt(d.content ?? existing.content);
  }

  if (d.slug !== undefined) {
    const wanted = slugify(d.slug);
    if (wanted && wanted !== existing.slug) {
      update.slug = await uniqueSlug(guard.supabase, wanted, id);
    }
  }

  // published_at is the date shown to readers and sent to search engines, so
  // it is stamped on the first publish and never moved by later edits.
  if (d.status !== undefined) {
    update.status = d.status;
    if (d.status === "published" && !existing.published_at) {
      update.published_at = new Date().toISOString();
    }
  }

  const { data, error } = await guard.supabase
    .from("blog_posts")
    .update(update)
    .eq("id", id)
    .select("id, slug, status")
    .single();

  if (error) {
    logger.error("blog_update_failed", { error: error.message, adminId: guard.userId });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logger.info("blog_updated", { adminId: guard.userId, slug: (data as { slug: string }).slug });
  return NextResponse.json({ post: data });
}

// DELETE /api/admin/blog/[id] — soft delete, recoverable from system trash
export async function DELETE(_req: NextRequest, { params }: Props) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const { error } = await guard.supabase
    .from("blog_posts")
    .update({ deleted_at: new Date().toISOString(), status: "draft" })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logger.info("blog_deleted", { adminId: guard.userId, postId: id });
  return NextResponse.json({ deleted: true });
}
