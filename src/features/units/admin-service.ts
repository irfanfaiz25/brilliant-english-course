import "server-only";

import { and, eq, inArray, isNull, ne, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { programLevels, quotaReservations, unitLevels, units } from "@/db/schema";
import {
  convertLeadInTransaction,
  releaseLeadSlotInTransaction,
} from "@/features/partners/admin-service";
import type { QuotaRules } from "@/features/quota/schema";
import { openReservation, quotaFromCounts, villageUsage } from "@/features/quota/service";
import { ActionFailure } from "@/lib/action-result";
import { writeAuditLog } from "@/lib/audit";

import { nextUnitCode } from "./codes";
import type { UnitForm } from "./schema";

/*
 * Unit writes for the admin (Phase 4c). Kept apart from `service.ts`, whose pure helpers also run
 * in the browser, so the database client never reaches a client bundle.
 */

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Serializes writes that share a key (unit codes, one village's quota) across concurrent saves. */
async function lock(tx: Tx, key: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${key}))`);
}

/** Slug must be unique among the live units of the same regency (the URL `/unit/<prov>/<kab>/<slug>`). */
async function assertSlugFree(tx: Tx, form: UnitForm, unitId?: string) {
  const [taken] = await tx
    .select({ id: units.id })
    .from(units)
    .where(
      and(
        eq(units.slug, form.slug),
        sql`left(${units.villageCode}, 5) = ${form.villageCode.slice(0, 5)}`,
        isNull(units.deletedAt),
        unitId ? ne(units.id, unitId) : undefined,
      ),
    )
    .limit(1);
  if (taken) throw new ActionFailure("invalid", { slug: "slugTaken" });
}

async function villageHasRoom(tx: Tx, villageCode: string, rules: QuotaRules, unitId?: string) {
  const usage = await villageUsage(tx, villageCode, { excludeUnitId: unitId });
  return quotaFromCounts(villageCode, usage.activeUnits, usage.reserved, rules).remaining >= 1;
}

/** An active unit takes a slot in its village: refuse when the village is already full. */
async function assertQuotaAllows(tx: Tx, form: UnitForm, rules: QuotaRules, unitId?: string) {
  if (form.status !== "active") return;
  await lock(tx, `quota:${form.villageCode}`);
  if (!(await villageHasRoom(tx, form.villageCode, rules, unitId))) {
    throw new ActionFailure("invalid", { status: "quotaFull" });
  }
}

/*
 * Slots held by units (ADR-039). A unit created from a lead in `onboarding` keeps the lead's slot
 * (a reservation with `unit_id`) until it becomes active, so the village cannot fill up in
 * between. Only such units hold one; a unit added by hand in `onboarding` does not.
 */

type UnitSlot = { id: string; villageCode: string; leadId: string | null };

async function unitSlots(tx: Tx, unitId: string): Promise<UnitSlot[]> {
  return tx
    .select({
      id: quotaReservations.id,
      villageCode: quotaReservations.villageCode,
      leadId: quotaReservations.leadId,
    })
    .from(quotaReservations)
    .where(and(eq(quotaReservations.unitId, unitId), openReservation));
}

async function releaseUnitSlots(tx: Tx, unitId: string): Promise<number> {
  const released = await tx
    .delete(quotaReservations)
    .where(and(eq(quotaReservations.unitId, unitId), openReservation))
    .returning({ id: quotaReservations.id });
  return released.length;
}

/** Holds one slot for an onboarding unit; refused when its village is already full. */
async function holdUnitSlot(
  tx: Tx,
  slot: { unitId: string; code: string; villageCode: string; leadId: string | null },
  rules: QuotaRules,
  actorId: string,
) {
  await lock(tx, `quota:${slot.villageCode}`);
  if (!(await villageHasRoom(tx, slot.villageCode, rules, slot.unitId))) {
    throw new ActionFailure("invalid", { status: "quotaFullHold" });
  }
  await tx.insert(quotaReservations).values({
    villageCode: slot.villageCode,
    slots: 1,
    leadId: slot.leadId,
    unitId: slot.unitId,
    note: slot.code,
    createdById: actorId,
  });
}

async function writeLevels(tx: Tx, unitId: string, slugs: UnitForm["levels"]) {
  const levels = await tx
    .select({ id: programLevels.id })
    .from(programLevels)
    .where(inArray(programLevels.slug, [...slugs]));
  await tx.delete(unitLevels).where(eq(unitLevels.unitId, unitId));
  if (levels.length > 0) {
    await tx.insert(unitLevels).values(levels.map((level) => ({ unitId, levelId: level.id })));
  }
}

const columns = (form: UnitForm) => ({
  name: form.name,
  slug: form.slug,
  status: form.status,
  enrollment: form.enrollment,
  villageCode: form.villageCode,
  address: form.address,
  latitude: form.latitude,
  longitude: form.longitude,
  managerName: form.managerName,
  whatsapp: form.whatsapp,
  openDays: form.openDays,
  opensAt: form.opensAt,
  closesAt: form.closesAt,
  studentsCount: form.studentsCount,
  openedAt: form.openedAt || null,
});

/**
 * Creates a unit with the next code of its province, its levels and an audit row. From a lead
 * (Phase 4d): the lead's reserved slot is freed before the quota check and the lead is marked
 * converted in the same transaction. An active unit takes the slot itself; an onboarding one
 * holds it as a reservation until it is active (ADR-039).
 */
export async function createUnit(
  form: UnitForm,
  rules: QuotaRules,
  actorId: string,
  { leadId }: { leadId?: string } = {},
): Promise<{ id: string; code: string }> {
  return db.transaction(async (tx) => {
    await lock(tx, "units:code");
    await assertSlugFree(tx, form);
    if (leadId) {
      await lock(tx, `quota:${form.villageCode}`);
      await releaseLeadSlotInTransaction(tx, leadId);
    }
    await assertQuotaAllows(tx, form, rules);
    // Every code ever issued, deleted units included, so a code is never handed out twice.
    const codes = await tx.select({ code: units.code }).from(units);
    const code = nextUnitCode(
      form.villageCode,
      codes.map((row) => row.code),
    );
    const [unit] = await tx
      .insert(units)
      .values({ code, ...columns(form) })
      .returning({ id: units.id });
    if (!unit) throw new Error("Unit insert returned no row");
    await writeLevels(tx, unit.id, form.levels);
    const holdsSlot = Boolean(leadId) && form.status === "onboarding";
    if (holdsSlot) {
      await holdUnitSlot(
        tx,
        { unitId: unit.id, code, villageCode: form.villageCode, leadId: leadId ?? null },
        rules,
        actorId,
      );
    }
    await writeAuditLog(tx, {
      actorId,
      action: "unit.create",
      entityType: "unit",
      entityId: unit.id,
      changes: {
        after: { code, ...form },
        leadId: leadId ?? null,
        ...(holdsSlot && { reservation: "held" }),
      },
    });
    if (leadId) await convertLeadInTransaction(tx, { leadId, unitId: unit.id, actorId });
    return { id: unit.id, code };
  });
}

/**
 * Saves a unit and its levels with a before/after audit row. A slot the unit holds (ADR-039) is
 * kept while it stays onboarding, follows it to another village, and is released otherwise
 * (before the quota check, so turning active hands the slot to the unit).
 */
export async function updateUnit(id: string, form: UnitForm, rules: QuotaRules, actorId: string) {
  await db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(units)
      .where(and(eq(units.id, id), isNull(units.deletedAt)))
      .for("update");
    if (!before) throw new ActionFailure("notFound");
    await assertSlugFree(tx, form, id);
    const reservation = await syncUnitSlot(tx, before, form, rules, actorId);
    await assertQuotaAllows(tx, form, rules, id);
    const beforeLevels = await tx
      .select({ slug: programLevels.slug })
      .from(unitLevels)
      .innerJoin(programLevels, eq(programLevels.id, unitLevels.levelId))
      .where(eq(unitLevels.unitId, id));

    await tx
      .update(units)
      .set({ ...columns(form), updatedAt: new Date() })
      .where(eq(units.id, id));
    await writeLevels(tx, id, form.levels);

    const { createdAt: _created, updatedAt: _updated, deletedAt: _deleted, ...previous } = before;
    await writeAuditLog(tx, {
      actorId,
      action: "unit.update",
      entityType: "unit",
      entityId: id,
      changes: {
        before: { ...previous, levels: beforeLevels.map((level) => level.slug) },
        after: form,
        ...(reservation && { reservation }),
      },
    });
  });
}

/** Applies the unit's new status and village to the slot it holds, if any. */
async function syncUnitSlot(
  tx: Tx,
  unit: { id: string; code: string },
  form: UnitForm,
  rules: QuotaRules,
  actorId: string,
): Promise<"released" | "moved" | null> {
  const [slot, ...extra] = await unitSlots(tx, unit.id);
  if (!slot) return null;
  if (form.status === "onboarding" && slot.villageCode === form.villageCode && !extra.length) {
    return null;
  }
  await lock(tx, `quota:${slot.villageCode}`);
  await releaseUnitSlots(tx, unit.id);
  if (form.status !== "onboarding") return "released";
  await holdUnitSlot(
    tx,
    { unitId: unit.id, code: unit.code, villageCode: form.villageCode, leadId: slot.leadId },
    rules,
    actorId,
  );
  return "moved";
}

/**
 * Removes a unit from the site and from the quota (soft delete, ADR-024), releasing a slot it
 * held: the row, its code and its history stay for the audit log.
 */
export async function deleteUnit(id: string, actorId: string) {
  await db.transaction(async (tx) => {
    const [unit] = await tx
      .update(units)
      .set({ deletedAt: new Date() })
      .where(and(eq(units.id, id), isNull(units.deletedAt)))
      .returning({ code: units.code, name: units.name, status: units.status });
    if (!unit) throw new ActionFailure("notFound");
    const released = await releaseUnitSlots(tx, id);
    await writeAuditLog(tx, {
      actorId,
      action: "unit.delete",
      entityType: "unit",
      entityId: id,
      changes: { before: unit, reservationsReleased: released },
    });
  });
}
