import { and, eq, gt, isNull, ne, or, sql, type SQL } from "drizzle-orm";

import type { Database } from "@/db/client";
import { db } from "@/db/client";
import { quotaReservations, units } from "@/db/schema";
import { ActionFailure } from "@/lib/action-result";
import { writeAuditLog } from "@/lib/audit";

import { quotaRulesDefaults } from "./defaults";
import type {
  QuotaReservation,
  QuotaRules,
  QuotaStatus,
  ReservationForm,
  VillageQuota,
} from "./schema";

/** Maps open slots to a status; "almost full" makes the urgency honest, never invented. */
export function quotaStatus(
  remaining: number,
  almostFullAt: number = quotaRulesDefaults.almostFullAt,
): QuotaStatus {
  if (remaining <= 0) return "full";
  if (remaining <= almostFullAt) return "almostFull";
  return "available";
}

/** Quota of one village from counts already aggregated (e.g. by SQL). */
export function quotaFromCounts(
  villageCode: string,
  activeUnits: number,
  reserved: number,
  rules: QuotaRules = quotaRulesDefaults,
): VillageQuota {
  const max = rules.unitsPerVillage;
  const remaining = Math.max(0, max - activeUnits - reserved);
  return {
    villageCode,
    max,
    activeUnits,
    reserved,
    remaining,
    status: quotaStatus(remaining, rules.almostFullAt),
  };
}

/**
 * Quota of one village: active units located in it plus slots reserved by onboarding partners,
 * capped by the rules (code defaults unless given).
 */
export function computeVillageQuota(
  villageCode: string,
  unitList: readonly { villageCode: string }[],
  reservations: readonly QuotaReservation[],
  rules: QuotaRules = quotaRulesDefaults,
): VillageQuota {
  const activeUnits = unitList.filter((unit) => unit.villageCode === villageCode).length;
  const reserved = reservations
    .filter((reservation) => reservation.villageCode === villageCode)
    .reduce((total, reservation) => total + reservation.slots, 0);
  return quotaFromCounts(villageCode, activeUnits, reserved, rules);
}

/** Reservations that still hold their slots (no end date, or ending in the future). */
export const openReservation: SQL = or(
  isNull(quotaReservations.expiresAt),
  gt(quotaReservations.expiresAt, sql`now()`),
) as SQL;

/** Active, non-deleted units. */
export const activeUnit: SQL = and(eq(units.status, "active"), isNull(units.deletedAt)) as SQL;

type Reader = Pick<Database, "select">;

/**
 * Slots used in a village right now: active units (optionally without one unit, when that unit
 * is being edited) and open reservations. Pass a transaction to read inside it.
 */
export async function villageUsage(
  executor: Reader,
  villageCode: string,
  { excludeUnitId }: { excludeUnitId?: string } = {},
): Promise<{ activeUnits: number; reserved: number }> {
  const [[unitRow], [reservationRow]] = await Promise.all([
    executor
      .select({ count: sql<number>`count(*)::int` })
      .from(units)
      .where(
        and(
          eq(units.villageCode, villageCode),
          activeUnit,
          excludeUnitId ? ne(units.id, excludeUnitId) : undefined,
        ),
      ),
    executor
      .select({ slots: sql<number>`coalesce(sum(${quotaReservations.slots}), 0)::int` })
      .from(quotaReservations)
      .where(and(eq(quotaReservations.villageCode, villageCode), openReservation)),
  ]);
  return { activeUnits: unitRow?.count ?? 0, reserved: reservationRow?.slots ?? 0 };
}

/** End of the chosen day in Indonesian western time, so "until 31 Dec" includes that day. */
export function reservationExpiry(expiresOn: string): Date | null {
  return expiresOn ? new Date(`${expiresOn}T23:59:59+07:00`) : null;
}

/**
 * Holds slots in a village for an onboarding partner. Refused (field error on `slots`) when the
 * village has fewer open slots than requested.
 */
export async function createReservation(
  form: ReservationForm,
  rules: QuotaRules,
  actorId: string,
): Promise<{ id: string }> {
  return db.transaction(async (tx) => {
    // Serialize quota changes per village so two admins cannot both take the last slot.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`quota:${form.villageCode}`}))`);
    const usage = await villageUsage(tx, form.villageCode);
    const quota = quotaFromCounts(form.villageCode, usage.activeUnits, usage.reserved, rules);
    if (form.slots > quota.remaining) {
      throw new ActionFailure("invalid", { slots: `quotaExceeded:${quota.remaining}` });
    }
    const [reservation] = await tx
      .insert(quotaReservations)
      .values({
        villageCode: form.villageCode,
        slots: form.slots,
        note: form.note,
        expiresAt: reservationExpiry(form.expiresOn),
        createdById: actorId,
      })
      .returning({ id: quotaReservations.id });
    if (!reservation) throw new Error("Reservation insert returned no row");
    await writeAuditLog(tx, {
      actorId,
      action: "quota.reserve",
      entityType: "quota_reservation",
      entityId: reservation.id,
      changes: { after: { ...form } },
    });
    return reservation;
  });
}

/** Releases a reservation: its slots count as open again right away. */
export async function releaseReservation(id: string, actorId: string) {
  await db.transaction(async (tx) => {
    const [released] = await tx
      .delete(quotaReservations)
      .where(eq(quotaReservations.id, id))
      .returning({
        villageCode: quotaReservations.villageCode,
        slots: quotaReservations.slots,
        note: quotaReservations.note,
      });
    if (!released) throw new ActionFailure("notFound");
    await writeAuditLog(tx, {
      actorId,
      action: "quota.release",
      entityType: "quota_reservation",
      entityId: id,
      changes: { before: released },
    });
  });
}
