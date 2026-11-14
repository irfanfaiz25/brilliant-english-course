import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { partnerLeadNotes, partnerLeads, quotaReservations } from "@/db/schema";
import type { QuotaRules } from "@/features/quota/schema";
import { openReservation, quotaFromCounts, villageUsage } from "@/features/quota/service";
import { ActionFailure } from "@/lib/action-result";
import { writeAuditLog } from "@/lib/audit";

import type { LeadNote, LeadUpdate } from "./schema";

/*
 * Lead writes for the admin pipeline (Phase 4d, ADR-030). A lead in `onboarding` holds one quota
 * slot in its village through a reservation linked to it; leaving `onboarding` (or converting,
 * or deleting the lead) releases it.
 */

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const liveLead = (id: string) => and(eq(partnerLeads.id, id), isNull(partnerLeads.deletedAt));

async function lockVillage(tx: Tx, villageCode: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`quota:${villageCode}`}))`);
}

/** Open reservations made for a lead (normally zero or one). */
async function leadReservations(tx: Tx, leadId: string) {
  return tx
    .select({ id: quotaReservations.id })
    .from(quotaReservations)
    .where(and(eq(quotaReservations.leadId, leadId), openReservation));
}

/** Releases every open reservation of a lead; returns how many were released. */
async function releaseLeadReservations(tx: Tx, leadId: string): Promise<number> {
  const released = await tx
    .delete(quotaReservations)
    .where(and(eq(quotaReservations.leadId, leadId), openReservation))
    .returning({ id: quotaReservations.id });
  return released.length;
}

/**
 * Saves status and assignee (plus an optional note) with one audit row. Entering `onboarding`
 * reserves a slot in the lead's village and is refused when the village is full.
 */
export async function updateLead(form: LeadUpdate, rules: QuotaRules, actorId: string) {
  await db.transaction(async (tx) => {
    const [lead] = await tx.select().from(partnerLeads).where(liveLead(form.id)).for("update");
    if (!lead) throw new ActionFailure("notFound");

    let reservation: "held" | "released" | null = null;
    if (form.status === "onboarding" && lead.status !== "onboarding") {
      await lockVillage(tx, lead.villageCode);
      if ((await leadReservations(tx, lead.id)).length === 0) {
        const usage = await villageUsage(tx, lead.villageCode);
        const quota = quotaFromCounts(lead.villageCode, usage.activeUnits, usage.reserved, rules);
        if (quota.remaining < 1) throw new ActionFailure("invalid", { status: "quotaFull" });
        await tx.insert(quotaReservations).values({
          villageCode: lead.villageCode,
          slots: 1,
          leadId: lead.id,
          note: lead.reference,
          createdById: actorId,
        });
        reservation = "held";
      }
    } else if (form.status !== "onboarding" && lead.status === "onboarding") {
      if ((await releaseLeadReservations(tx, lead.id)) > 0) reservation = "released";
    }

    const assignedToId = form.assignedToId || null;
    await tx
      .update(partnerLeads)
      .set({ status: form.status, assignedToId, updatedAt: new Date() })
      .where(eq(partnerLeads.id, lead.id));
    if (form.note) {
      await tx
        .insert(partnerLeadNotes)
        .values({ leadId: lead.id, authorId: actorId, body: form.note });
    }

    const changes: Record<string, unknown> = {};
    if (lead.status !== form.status) changes.status = { from: lead.status, to: form.status };
    if (lead.assignedToId !== assignedToId) {
      changes.assignedToId = { from: lead.assignedToId, to: assignedToId };
    }
    if (reservation) changes.reservation = reservation;
    if (form.note) changes.note = true;
    await writeAuditLog(tx, {
      actorId,
      action: "lead.update",
      entityType: "partner_lead",
      entityId: lead.id,
      changes,
    });
  });
}

/** Adds a follow-up note to a lead's history. */
export async function addLeadNote(form: LeadNote, actorId: string) {
  await db.transaction(async (tx) => {
    const [lead] = await tx
      .select({ id: partnerLeads.id })
      .from(partnerLeads)
      .where(liveLead(form.id));
    if (!lead) throw new ActionFailure("notFound");
    const [note] = await tx
      .insert(partnerLeadNotes)
      .values({ leadId: lead.id, authorId: actorId, body: form.body })
      .returning({ id: partnerLeadNotes.id });
    await writeAuditLog(tx, {
      actorId,
      action: "lead.note",
      entityType: "partner_lead",
      entityId: lead.id,
      changes: { noteId: note?.id },
    });
  });
}

/** Removes a lead from the pipeline (spam, duplicates): soft delete, its slot released. */
export async function deleteLead(id: string, actorId: string) {
  await db.transaction(async (tx) => {
    const [lead] = await tx
      .update(partnerLeads)
      .set({ deletedAt: new Date() })
      .where(liveLead(id))
      .returning({ reference: partnerLeads.reference, status: partnerLeads.status });
    if (!lead) throw new ActionFailure("notFound");
    const released = await releaseLeadReservations(tx, id);
    await writeAuditLog(tx, {
      actorId,
      action: "lead.delete",
      entityType: "partner_lead",
      entityId: id,
      changes: { before: lead, reservationsReleased: released },
    });
  });
}

/**
 * Inside the transaction that creates a unit from a lead: releases any slot still held, marks the
 * lead converted and links the unit, with an audit row.
 */
export async function convertLeadInTransaction(
  tx: Tx,
  { leadId, unitId, actorId }: { leadId: string; unitId: string; actorId: string },
) {
  const [lead] = await tx.select().from(partnerLeads).where(liveLead(leadId)).for("update");
  if (!lead) throw new ActionFailure("notFound");
  const released = await releaseLeadReservations(tx, leadId);
  await tx
    .update(partnerLeads)
    .set({ status: "converted", unitId, updatedAt: new Date() })
    .where(eq(partnerLeads.id, leadId));
  await writeAuditLog(tx, {
    actorId,
    action: "lead.convert",
    entityType: "partner_lead",
    entityId: leadId,
    changes: {
      status: { from: lead.status, to: "converted" },
      unitId,
      reservationsReleased: released,
    },
  });
}

/** Frees a lead's reserved slot inside another transaction (before a unit takes it). */
export async function releaseLeadSlotInTransaction(tx: Tx, leadId: string) {
  return releaseLeadReservations(tx, leadId);
}

/** Records a CSV export of leads (personal data leaving the system) in the audit log. */
export async function recordLeadExport(
  actorId: string,
  { count, filter }: { count: number; filter: Record<string, unknown> },
) {
  await writeAuditLog(db, {
    actorId,
    action: "lead.export",
    entityType: "partner_lead",
    entityId: "export",
    changes: { count, filter },
  });
}
