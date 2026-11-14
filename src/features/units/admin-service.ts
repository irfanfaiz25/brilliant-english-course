import "server-only";

import { and, eq, inArray, isNull, ne, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { programLevels, unitLevels, units } from "@/db/schema";
import {
  convertLeadInTransaction,
  releaseLeadSlotInTransaction,
} from "@/features/partners/admin-service";
import type { QuotaRules } from "@/features/quota/schema";
import { quotaFromCounts, villageUsage } from "@/features/quota/service";
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

/** An active unit takes a slot in its village: refuse when the village is already full. */
async function assertQuotaAllows(tx: Tx, form: UnitForm, rules: QuotaRules, unitId?: string) {
  if (form.status !== "active") return;
  await lock(tx, `quota:${form.villageCode}`);
  const usage = await villageUsage(tx, form.villageCode, { excludeUnitId: unitId });
  const quota = quotaFromCounts(form.villageCode, usage.activeUnits, usage.reserved, rules);
  if (quota.remaining < 1) throw new ActionFailure("invalid", { status: "quotaFull" });
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
 * (Phase 4d): the lead's reserved slot is freed before the quota check (the unit takes it) and
 * the lead is marked converted in the same transaction.
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
    await writeAuditLog(tx, {
      actorId,
      action: "unit.create",
      entityType: "unit",
      entityId: unit.id,
      changes: { after: { code, ...form }, leadId: leadId ?? null },
    });
    if (leadId) await convertLeadInTransaction(tx, { leadId, unitId: unit.id, actorId });
    return { id: unit.id, code };
  });
}

/** Saves a unit and its levels with a before/after audit row. */
export async function updateUnit(id: string, form: UnitForm, rules: QuotaRules, actorId: string) {
  await db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(units)
      .where(and(eq(units.id, id), isNull(units.deletedAt)))
      .for("update");
    if (!before) throw new ActionFailure("notFound");
    await assertSlugFree(tx, form, id);
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
      },
    });
  });
}

/**
 * Removes a unit from the site and from the quota (soft delete, ADR-024): the row, its code and
 * its history stay for the audit log.
 */
export async function deleteUnit(id: string, actorId: string) {
  await db.transaction(async (tx) => {
    const [unit] = await tx
      .update(units)
      .set({ deletedAt: new Date() })
      .where(and(eq(units.id, id), isNull(units.deletedAt)))
      .returning({ code: units.code, name: units.name, status: units.status });
    if (!unit) throw new ActionFailure("notFound");
    await writeAuditLog(tx, {
      actorId,
      action: "unit.delete",
      entityType: "unit",
      entityId: id,
      changes: { before: unit },
    });
  });
}
