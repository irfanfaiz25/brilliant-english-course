import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";

import type { NetworkStats } from "./schema";

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
