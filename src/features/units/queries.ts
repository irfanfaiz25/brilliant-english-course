import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";

import { unitFixtures } from "./fixtures";
import type { NetworkStats, UnitSummary } from "./schema";

/**
 * Totals across the unit network. PLACEHOLDER numbers until units are stored (Phase 3); then this
 * becomes COUNT queries over active units, distinct regencies and enrolled students.
 */
export async function getNetworkStats(): Promise<NetworkStats> {
  "use cache";
  cacheTag(cacheTags.units);
  cacheLife("hours");
  return { activeUnits: 128, cities: 42, students: 5400 };
}

/** A few units to preview on the home page. Becomes "nearest/most recent active units" in Phase 3. */
export async function getFeaturedUnits(limit = 2): Promise<UnitSummary[]> {
  "use cache";
  cacheTag(cacheTags.units);
  cacheLife("hours");
  return unitFixtures.slice(0, limit);
}

/** All active units shown on the public site. Phase 3: active, not soft-deleted units. */
export async function getActiveUnits(): Promise<UnitSummary[]> {
  "use cache";
  cacheTag(cacheTags.units);
  cacheLife("hours");
  return unitFixtures;
}
