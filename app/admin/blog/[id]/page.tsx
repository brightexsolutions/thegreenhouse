import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { BlogEditor } from "@/components/admin/blog-editor";
import { isAiConfigured } from "@/lib/ai";
import type { BlogPost } from "@/lib/blog";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditBlogPostPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) notFound();
  const post = data as BlogPost;

  return (
    <BlogEditor
      aiEnabled={isAiConfigured()}
      initial={{
        id:               post.id,
        title:            post.title,
        slug:             post.slug,
        excerpt:          post.excerpt ?? "",
        content:          post.content,
        cover_image:      post.cover_image ?? "",
        cover_alt:        post.cover_alt ?? "",
        author_name:      post.author_name,
        category:         post.category,
        tags:             post.tags ?? [],
        status:           post.status,
        meta_title:       post.meta_title ?? "",
        meta_description: post.meta_description ?? "",
      }}
    />
  );
}
