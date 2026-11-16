import "server-only";

import { limits } from "@/config/limits";
import { getVillageQuotas } from "@/features/quota/queries";

import { searchRegions } from "./queries";
import type { RegionSearchParams, RegionSearchResult } from "./schema";

/**
 * Region search for the public pages (ADR-047): matching regions of the asked levels and, when
 * asked, the partnership quota of the villages among them (Kemitraan shows it in the results).
 */
export async function findRegions({
  q,
  levels,
  quota,
}: RegionSearchParams): Promise<RegionSearchResult[]> {
  const results = await searchRegions(q, levels, limits.regionSearch.results);
  if (!quota) return results;

  const villages = results.filter((result) => result.level === "village");
  const quotas = await getVillageQuotas(villages.map((village) => village.code));
  const byCode = new Map(quotas.map((entry) => [entry.villageCode, entry]));
  return results.map((result) => {
    const entry = byCode.get(result.code);
    return entry
      ? { ...result, quota: { status: entry.status, remaining: entry.remaining } }
      : result;
  });
}
