import "server-only";

import { DatabaseError } from "pg";

import { db } from "@/db/client";
import { partnerLeads } from "@/db/schema";
import type { Locale } from "@/i18n/routing";
import { writeAuditLog } from "@/lib/audit";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";

import { createLeadReference } from "./reference";
import type { PartnerApplication } from "./schema";

/** References are random; a clash is rare but possible, so a few fresh ones are tried. */
const REFERENCE_ATTEMPTS = 3;
const UNIQUE_VIOLATION = "23505";

type LeadContext = { locale: Locale; ipHash: string | null };

/**
 * Stores a partner lead (ADR-007, ADR-018) and its audit row in one transaction. Notifications to
 * the applicant and the owner follow in Phase 6; the pipeline lands in admin in Phase 4d.
 */
export async function createPartnerLead(
  application: PartnerApplication,
  { locale, ipHash }: LeadContext,
): Promise<{ reference: string }> {
  for (let attempt = 1; ; attempt += 1) {
    const reference = createLeadReference();
    try {
      await db.transaction(async (tx) => {
        const [lead] = await tx
          .insert(partnerLeads)
          .values({
            reference,
            fullName: application.fullName,
            whatsapp: normalizeWhatsAppNumber(application.whatsapp),
            email: application.email || null,
            background: application.background,
            space: application.space,
            motivation: application.motivation,
            villageCode: application.villageCode,
            locale,
            ipHash,
          })
          .returning({ id: partnerLeads.id });
        if (!lead) throw new Error("Lead insert returned no row");
        await writeAuditLog(tx, {
          actorId: null,
          action: "lead.create",
          entityType: "partner_lead",
          entityId: lead.id,
          changes: { reference, villageCode: application.villageCode },
          ipHash,
        });
      });
      return { reference };
    } catch (error) {
      const clash =
        error instanceof DatabaseError &&
        error.code === UNIQUE_VIOLATION &&
        error.constraint === "partner_leads_reference_unique";
      if (!clash || attempt >= REFERENCE_ATTEMPTS) throw error;
    }
  }
}
