import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth-guard";
import { slugify, readingMinutes, deriveExcerpt } from "@/lib/blog";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  title:            z.string().trim().min(3).max(160),
  content:          z.string().trim().min(1),
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

/** Append -2, -3 ... until the slug is free. */
async function uniqueSlug(
  supabase: SupabaseClient,
  base: string,
  excludeId?: string
): Promise<string> {
  const root = base || "post";
  let candidate = root;
  for (let n = 2; n < 100; n++) {
    let query = supabase.from("blog_posts").select("id").eq("slug", candidate);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return candidate;
    candidate = `${root}-${n}`;
  }
  return `${root}-${Date.now()}`;
}

// GET /api/admin/blog — every post, drafts included
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { data, error } = await guard.supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, cover_image, author_name, category, tags, status, reading_minutes, view_count, published_at, created_at, updated_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data ?? [] });
}

// POST /api/admin/blog — create a post
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const d = parsed.data;
  const slug = await uniqueSlug(guard.supabase, slugify(d.slug || d.title));
  const status = d.status ?? "draft";

  const { data, error } = await guard.supabase
    .from("blog_posts")
    .insert({
      slug,
      title:            d.title,
      content:          d.content,
      excerpt:          d.excerpt?.trim() || deriveExcerpt(d.content),
      cover_image:      d.cover_image?.trim() || null,
      cover_alt:        d.cover_alt?.trim() || null,
      author_name:      d.author_name?.trim() || "The Green House",
      category:         d.category ?? "reflection",
      tags:             d.tags ?? [],
      status,
      meta_title:       d.meta_title?.trim() || null,
      meta_description: d.meta_description?.trim() || null,
      reading_minutes:  readingMinutes(d.content),
      published_at:     status === "published" ? new Date().toISOString() : null,
    })
    .select("id, slug")
    .single();

  if (error) {
    logger.error("blog_create_failed", { error: error.message, adminId: guard.userId });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logger.info("blog_created", { adminId: guard.userId, slug });
  return NextResponse.json({ post: data }, { status: 201 });
}
