/**
 * Blog helpers with no dependencies, safe to import from client components.
 *
 * lib/blog.ts imports `marked`, so anything a client component imported from
 * there dragged the whole Markdown parser into the browser bundle. The admin
 * editor and table only need these pure functions. lib/blog.ts re-exports
 * everything here, so server code can keep importing from "@/lib/blog".
 */

export const BLOG_CATEGORIES = [
  { value: "reflection",    label: "Reflection" },
  { value: "session-recap", label: "Session Recap" },
  { value: "teaching",      label: "Teaching" },
  { value: "community",     label: "Community" },
  { value: "announcement",  label: "Announcement" },
] as const;

export type BlogCategory = typeof BLOG_CATEGORIES[number]["value"];

export interface BlogPost {
  id:               string;
  slug:             string;
  title:            string;
  excerpt:          string | null;
  content:          string;
  cover_image:      string | null;
  cover_alt:        string | null;
  author_name:      string;
  category:         BlogCategory;
  tags:             string[];
  status:           "draft" | "published";
  meta_title:       string | null;
  meta_description: string | null;
  reading_minutes:  number;
  view_count:       number;
  published_at:     string | null;
  created_at:       string;
  updated_at:       string;
}

export function categoryLabel(value: string): string {
  return BLOG_CATEGORIES.find(c => c.value === value)?.label ?? "Reflection";
}

/** URL-safe slug from a title. Collisions are resolved by the caller. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Rough reading time. 200 words per minute, floor of 1. */
export function readingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** First paragraph of the body, trimmed to fit a meta description. */
export function deriveExcerpt(markdown: string, limit = 200): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= limit) return plain;
  const cut = plain.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : limit).trim()}...`;
}

export function formatPostDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric", month: "long", year: "numeric",
  });
}
