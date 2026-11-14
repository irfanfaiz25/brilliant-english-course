import { limits } from "@/config/limits";

import type { QuotaReservation, QuotaStatus, VillageQuota } from "./schema";

/** Maps open slots to a status; "almost full" makes the urgency honest, never invented. */
export function quotaStatus(remaining: number): QuotaStatus {
  if (remaining <= 0) return "full";
  if (remaining <= limits.quotaAlmostFullAt) return "almostFull";
  return "available";
}

/**
 * Quota of one village: active units located in it plus slots reserved by onboarding partners,
 * capped at `max` (default `limits.unitsPerVillage`).
 */
export function computeVillageQuota(
  villageCode: string,
  units: readonly { villageCode: string }[],
  reservations: readonly QuotaReservation[],
  max: number = limits.unitsPerVillage,
): VillageQuota {
  const activeUnits = units.filter((unit) => unit.villageCode === villageCode).length;
  const reserved = reservations
    .filter((reservation) => reservation.villageCode === villageCode)
    .reduce((total, reservation) => total + reservation.slots, 0);
  return quotaFromCounts(villageCode, activeUnits, reserved, max);
}

/** Quota of one village from counts already aggregated (e.g. by SQL). */
export function quotaFromCounts(
  villageCode: string,
  activeUnits: number,
  reserved: number,
  max: number = limits.unitsPerVillage,
): VillageQuota {
  const remaining = Math.max(0, max - activeUnits - reserved);
  return { villageCode, max, activeUnits, reserved, remaining, status: quotaStatus(remaining) };
}
