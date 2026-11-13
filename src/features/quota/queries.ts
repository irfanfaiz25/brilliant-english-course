import "server-only";

import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";
import { db } from "@/db/client";
import { quotaReservations, units } from "@/db/schema";

import type { VillageQuota } from "./schema";
import { quotaFromCounts } from "./service";

/**
 * Partnership quota of one village: active units located in it plus open reservations. The
 * per-village maximum becomes an admin setting in Phase 4c (`limits.unitsPerVillage` until then).
 */
export async function getVillageQuota(villageCode: string): Promise<VillageQuota> {
  "use cache";
  cacheTag(cacheTags.quota, cacheTags.units);
  cacheLife("minutes");

  const [[unitRow], [reservationRow]] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(units)
      .where(
        and(
          eq(units.villageCode, villageCode),
          eq(units.status, "active"),
          isNull(units.deletedAt),
        ),
      ),
    db
      .select({ slots: sql<number>`coalesce(sum(${quotaReservations.slots}), 0)::int` })
      .from(quotaReservations)
      .where(
        and(
          eq(quotaReservations.villageCode, villageCode),
          or(isNull(quotaReservations.expiresAt), gt(quotaReservations.expiresAt, sql`now()`)),
        ),
      ),
  ]);

  return quotaFromCounts(villageCode, unitRow?.count ?? 0, reservationRow?.slots ?? 0);
}
