import { randomInt } from "node:crypto";

import type { PartnerApplication } from "./schema";

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

/**
 * Stores a partner lead. PLACEHOLDER: nothing is persisted until the leads table exists
 * (Phase 3) and the pipeline lands in admin (Phase 4d, ADR-007); notifications follow in Phase 6.
 * The signature already matches the final one so the action does not change.
 */
export async function createPartnerLead(
  application: PartnerApplication,
): Promise<{ reference: string }> {
  void application;
  return { reference: createLeadReference() };
}
