import "server-only";

import { asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";
import { db } from "@/db/client";
import { regions } from "@/db/schema";

import type { Region, RegionLevel, RegionSearchResult } from "./schema";
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

/**
 * Regions whose name matches the typed text (ADR-047): substring matches first, then close
 * spellings ("singorejo" also finds Singorojo), with their ancestors as a short area line.
 * `query` is already normalised (lowercase, single spaces) and `levels` sorted, so the cache key
 * is stable. Uses the trigram index on `regions.name`.
 */
export async function searchRegions(
  query: string,
  levels: readonly RegionLevel[],
  limit: number,
): Promise<RegionSearchResult[]> {
  "use cache";
  cacheTag(cacheTags.regions);
  cacheLife("days");

  // `%` and `_` typed by the visitor are literal characters, not LIKE wildcards.
  const literal = query.replace(/[\\%_]/g, (char) => `\\${char}`);
  const pattern = `%${literal}%`;
  const prefix = `${literal}%`;
  const rows = await db.execute<{
    code: string;
    name: string;
    level: RegionLevel;
    parent: string | null;
    grandparent: string | null;
    root: string | null;
  }>(sql`
    select r.code, r.name, r.level, p1.name as parent, p2.name as grandparent, p3.name as root
    from ${regions} r
    left join ${regions} p1 on p1.code = r.parent_code
    left join ${regions} p2 on p2.code = p1.parent_code
    left join ${regions} p3 on p3.code = p2.parent_code
    where r.level in (${sql.join(
      levels.map((level) => sql`${level}::region_level`),
      sql`, `,
    )})
      and (r.name ilike ${pattern} or ${query} <% r.name)
    order by
      -- The name without "Kabupaten"/"Kota" equals the text: "depok" puts Kota Depok first.
      (lower(r.name) = ${query}
        or regexp_replace(lower(r.name), '^(kabupaten|kota|kota administrasi) ', '') = ${query}) desc,
      -- Then wider areas first: a city before its districts and villages of the same name.
      array_position(array['province', 'regency', 'district', 'village']::region_level[], r.level),
      r.name ilike ${prefix} desc,
      word_similarity(${query}, r.name) desc,
      length(r.name),
      r.code
    limit ${limit}
  `);

  return rows.rows.map((row) => ({
    code: row.code,
    name: shortRegionName(row.name),
    level: row.level,
    area: [row.parent, row.grandparent, row.root]
      .filter((name): name is string => name !== null)
      .map(shortRegionName)
      .join(", "),
  }));
}
