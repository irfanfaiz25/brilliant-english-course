import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";

import { regionFixtures } from "./fixtures";
import type { Region } from "./schema";
import { parentRegionCode, regionCodePath } from "./service";

/** Direct children of a region (provinces when `parentCode` is null), sorted by name. */
export async function getRegionChildren(parentCode: string | null): Promise<Region[]> {
  "use cache";
  cacheTag(cacheTags.regions);
  cacheLife("days");
  return regionFixtures
    .filter((region) => parentRegionCode(region.code) === parentCode)
    .sort((a, b) => a.name.localeCompare(b.name, "id"));
}

/** The chain province → … → region for a code, or `[]` when the code is unknown. */
export async function getRegionPath(code: string): Promise<Region[]> {
  "use cache";
  cacheTag(cacheTags.regions);
  cacheLife("days");
  const byCode = new Map(regionFixtures.map((region) => [region.code, region]));
  const path = regionCodePath(code).map((part) => byCode.get(part));
  return path.every((region): region is Region => region !== undefined) ? path : [];
}
