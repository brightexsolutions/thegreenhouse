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

/**
 * Format a database `time` value ("19:00:00", 24 hour) for display: "7:00 PM".
 * Never slice the raw value and append "pm": that is how "19.00pm" got onto
 * tickets.
 */
export function formatEventTime(time: string | null | undefined, fallback = ""): string {
  if (!time) return fallback;
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h)) return fallback;
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m || 0).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

/**
 * The instant an event starts. Sessions happen in Nairobi (UTC+3, no DST), so
 * the offset is fixed here rather than left to the visitor's device, which
 * would shift every countdown for anyone outside Kenya.
 */
export function eventStart(date: string, time?: string | null): Date {
  const t = (time ?? "00:00:00").slice(0, 8);
  return new Date(`${date}T${t.length === 5 ? `${t}:00` : t}+03:00`);
}

/** Today's date in Nairobi as YYYY-MM-DD, for comparing against event_date. */
export function todayInNairobi(): string {
  return new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
