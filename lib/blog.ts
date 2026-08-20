import { marked } from "marked";

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

/** Escape the five characters that can start a tag or break an attribute. */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only allow schemes that cannot execute script. */
function safeHref(href: string): string | null {
  const trimmed = href.trim();
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  // Site-relative links, which is how posts link to /events and /about.
  if (/^\/(?!\/)/.test(trimmed) || /^#/.test(trimmed)) return trimmed;
  return null;
}

marked.use({
  renderer: {
    // Headings carry the same ids that extractHeadings() derives, so the
    // contents list on the article page can link into the body.
    heading(token: { tokens: unknown[]; depth: number }) {
      const text = this.parser.parseInline(token.tokens as never);
      const id   = slugify(text.replace(/<[^>]+>/g, ""));
      return `<h${token.depth} id="${id}">${text}</h${token.depth}>\n`;
    },

    // Raw HTML in the source is shown as text rather than executed. This is
    // the entire sanitisation strategy: if no HTML gets through the parser,
    // there is nothing downstream to clean up.
    //
    // This replaced isomorphic-dompurify, which works but drags jsdom in with
    // it. jsdom does not survive Vercel's serverless bundling, so every post
    // rendered at runtime returned a 500 while posts prerendered at build time
    // were fine. Parsing markdown should not require a DOM implementation.
    html(token: { text: string }) {
      return escapeHtml(token.text);
    },

    link(token: { href: string; title?: string | null; tokens: unknown[] }) {
      const href = safeHref(token.href);
      const text = this.parser.parseInline(token.tokens as never);
      if (!href) return text;
      const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
      const external = /^https?:/i.test(href);
      const rel = external ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${escapeHtml(href)}"${title}${rel}>${text}</a>`;
    },

    image(token: { href: string; title?: string | null; text: string }) {
      const href = safeHref(token.href);
      if (!href) return escapeHtml(token.text);
      const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
      return `<img src="${escapeHtml(href)}" alt="${escapeHtml(token.text)}"${title} loading="lazy" />`;
    },
  },
});

/**
 * Markdown to HTML for a post body.
 *
 * Safe by construction: the renderer above never emits a tag it did not build
 * itself, and raw HTML from the source is escaped into visible text. No DOM,
 * so this runs anywhere.
 */
export function renderMarkdown(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
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
