import { randomInt } from "node:crypto";

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Short, human-friendly lead reference such as "MTR-261113-7KQ4" (date + 4 unambiguous
 * characters), quoted by the applicant on WhatsApp.
 */
export function createLeadReference(now: Date = new Date()): string {
  const date = now.toISOString().slice(2, 10).replaceAll("-", "");
  const suffix = Array.from(
    { length: 4 },
    () => REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)],
  ).join("");
  return `MTR-${date}-${suffix}`;
}
