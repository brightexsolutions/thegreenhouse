import Link from "next/link";
import { PenSquare, Plus } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/ui/page-header";
import { BlogTable } from "@/components/admin/blog-table";
import type { BlogPost } from "@/lib/blog";

export const dynamic = "force-dynamic";

type PostRow = Pick<
  BlogPost,
  "id" | "slug" | "title" | "excerpt" | "cover_image" | "author_name" |
  "category" | "tags" | "status" | "reading_minutes" | "view_count" |
  "published_at" | "created_at" | "updated_at"
>;

async function getPosts(): Promise<PostRow[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, cover_image, author_name, category, tags, status, reading_minutes, view_count, published_at, created_at, updated_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return (data ?? []) as PostRow[];
}

export default async function AdminBlogPage() {
  const posts = await getPosts();
  const published = posts.filter(p => p.status === "published").length;
  const drafts    = posts.length - published;

  return (
    <div className="flex flex-col gap-5 h-full">
      <PageHeader
        title="Blog"
        description={
          posts.length === 0
            ? "No posts yet"
            : `${published} published · ${drafts} draft${drafts === 1 ? "" : "s"}`
        }
        action={
          <Link
            href="/admin/blog/new"
            className="inline-flex items-center gap-2 bg-forest text-cream text-sm font-medium px-4 py-2.5 rounded hover:bg-moss transition-colors"
          >
            <Plus size={15} />
            New post
          </Link>
        }
      />

      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-mist overflow-hidden flex flex-col">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-16 px-6 text-center">
            <PenSquare size={28} className="text-charcoal/15 mb-3" />
            <p className="text-sm text-charcoal/40">Nothing published yet</p>
            <p className="text-xs text-charcoal/25 mt-1 max-w-xs">
              Posts keep the site fresh between sessions and give search engines something new to index.
            </p>
            <Link
              href="/admin/blog/new"
              className="mt-5 inline-flex items-center gap-2 bg-forest text-cream text-sm font-medium px-4 py-2.5 rounded hover:bg-moss transition-colors"
            >
              <Plus size={15} />
              Write the first post
            </Link>
          </div>
        ) : (
          <BlogTable posts={posts} />
        )}
      </div>
    </div>
  );
}
