/**
 * Normalizes an Indonesian phone number to the international digits WhatsApp expects:
 * "0812-0000-0000", "+62 812…" and "62812…" all become "62812…".
 */
export function normalizeWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

/** Builds a `wa.me` click-to-chat link with an optional pre-filled message (DESIGN.md § 5.3). */
export function buildWhatsAppUrl(phone: string, message?: string): string {
  const url = new URL(`https://wa.me/${normalizeWhatsAppNumber(phone)}`);
  if (message) url.searchParams.set("text", message);
  return url.toString();
}
