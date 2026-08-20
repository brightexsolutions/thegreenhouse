import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

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

marked.setOptions({ gfm: true, breaks: false });

// Headings carry the same ids that extractHeadings() derives, so the contents
// list on the article page can link straight into the body.
marked.use({
  renderer: {
    heading(token: { tokens: unknown[]; depth: number }) {
      const text = this.parser.parseInline(token.tokens as never);
      const id   = slugify(text.replace(/<[^>]+>/g, ""));
      return `<h${token.depth} id="${id}">${text}</h${token.depth}>\n`;
    },
  },
});

/**
 * Markdown to HTML for a post body.
 *
 * Posts are authored by admins, so this is not the primary defence, but the
 * output is served to every visitor and indexed by crawlers. Sanitising costs
 * nothing here and means a compromised admin account cannot plant a script
 * tag on the public site.
 */
export function renderMarkdown(markdown: string): string {
  const raw = marked.parse(markdown, { async: false }) as string;
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr", "blockquote",
      "ul", "ol", "li",
      "strong", "em", "del", "code", "pre",
      "a", "img", "figure", "figcaption",
      "table", "thead", "tbody", "tr", "th", "td",
    ],
    ALLOWED_ATTR: ["href", "title", "src", "alt", "width", "height", "target", "rel", "id"],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|\/)/i,
  });
}

/** Headings in the body, used to build the on-page contents list. */
export function extractHeadings(markdown: string): Array<{ id: string; text: string; level: number }> {
  const out: Array<{ id: string; text: string; level: number }> = [];
  for (const line of markdown.split("\n")) {
    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!match) continue;
    const text = match[2].replace(/[*_`]/g, "").trim();
    out.push({ id: slugify(text), text, level: match[1].length });
  }
  return out;
}

export function formatPostDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric", month: "long", year: "numeric",
  });
}
