import { BlogEditor } from "@/components/admin/blog-editor";
import { isAiConfigured } from "@/lib/ai";

export const dynamic = "force-dynamic";

export default function NewBlogPostPage() {
  return <BlogEditor aiEnabled={isAiConfigured()} />;
}
