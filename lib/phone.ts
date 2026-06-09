/**
 * Normalises a phone number to E.164 format (+254...) for Kenyan numbers.
 * Adapted from brightex-website normalisePhone().
 */
export function normalisePhone(raw: string): string {
  const stripped = raw.replace(/[\s\-.() ]/g, "");
  if (!stripped) return raw;

  if (stripped.startsWith("+"))  return stripped;
  if (stripped.startsWith("00")) return `+${stripped.slice(2)}`;

  // Kenyan mobile: 07xx or 01xx (10 digits)
  if (/^0[17]\d{8}$/.test(stripped)) return `+254${stripped.slice(1)}`;

  if (stripped.startsWith("254")) return `+${stripped}`;

  return stripped;
}

export function isKenyanNumber(phone: string): boolean {
  return normalisePhone(phone).startsWith("+254");
}
