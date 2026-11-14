import "server-only";

import { asc, eq, inArray, isNull } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";
import { db } from "@/db/client";
import { regions } from "@/db/schema";

import type { Region } from "./schema";
import { regionCodePath, shortRegionName } from "./service";

const columns = { code: regions.code, name: regions.name };
const toRegion = (row: { code: string; name: string }): Region => ({
  code: row.code,
  name: shortRegionName(row.name),
});
const byName = (a: Region, b: Region) => a.name.localeCompare(b.name, "id");

/** Direct children of a region (provinces when `parentCode` is null), sorted by display name. */
export async function getRegionChildren(parentCode: string | null): Promise<Region[]> {
  "use cache";
  cacheTag(cacheTags.regions);
  cacheLife("days");
  const rows = await db
    .select(columns)
    .from(regions)
    .where(parentCode === null ? isNull(regions.parentCode) : eq(regions.parentCode, parentCode))
    .orderBy(asc(regions.name));
  // Sorted again after shortening: "Kab. X" and "Kota Y" interleave differently than the long names.
  return rows.map(toRegion).sort(byName);
}

/** Regions for the given codes (unknown codes are skipped). */
export async function getRegionsByCodes(codes: readonly string[]): Promise<Region[]> {
  "use cache";
  cacheTag(cacheTags.regions);
  cacheLife("days");
  if (codes.length === 0) return [];
  const rows = await db
    .select(columns)
    .from(regions)
    .where(inArray(regions.code, [...codes]));
  return rows.map(toRegion);
}

/** The chain province → … → region for a code, or `[]` when the code is unknown. */
export async function getRegionPath(code: string): Promise<Region[]> {
  const codes = regionCodePath(code);
  const found = new Map((await getRegionsByCodes(codes)).map((region) => [region.code, region]));
  const path = codes.map((part) => found.get(part));
  return path.every((region): region is Region => region !== undefined) ? path : [];
}
