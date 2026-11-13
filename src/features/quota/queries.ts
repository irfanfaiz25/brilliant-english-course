import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";
import { getActiveUnits } from "@/features/units/queries";

import { quotaReservationFixtures } from "./fixtures";
import type { VillageQuota } from "./schema";
import { computeVillageQuota } from "./service";

/**
 * Partnership quota of one village. Reads unit and reservation fixtures until the quota module
 * lands (Phase 4c); the per-village maximum becomes an admin setting then.
 */
export async function getVillageQuota(villageCode: string): Promise<VillageQuota> {
  "use cache";
  cacheTag(cacheTags.quota, cacheTags.units);
  cacheLife("minutes");
  const units = await getActiveUnits();
  return computeVillageQuota(villageCode, units, quotaReservationFixtures);
}
