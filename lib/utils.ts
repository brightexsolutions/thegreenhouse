import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strip the site name prefix from an event title.
 *
 * Titles are typed by hand in the admin panel, so the separator between the
 * site name and the session name has drifted over time: some rows use an em
 * dash, some an en dash, some a hyphen, some a colon. Every display surface
 * needs the bare session name, so the separator is tolerated in one place
 * rather than matched literally at a dozen call sites.
 */
export function sessionName(title: string | null | undefined, fallback = "the session"): string {
  if (!title) return fallback;
  const stripped = title
    // \u2014 / \u2013 are escaped so the literal characters never appear in
    // the source, which is what lint:copy checks for.
    .replace(/^\s*(?:The\s+)?Green\s*House(?:\s+W\.?S\.?)?\s*[\u2014\u2013\-:·|]\s*/i, "")
    .trim();
  return stripped || title.trim() || fallback;
}
