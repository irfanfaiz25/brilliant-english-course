import "server-only";

import { asc, eq, inArray, isNull, sql, type SQL } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";
import { db } from "@/db/client";
import { regions } from "@/db/schema";

import type { Region, RegionLevel, RegionSearchResult } from "./schema";
import { fuzzyTerm, likeLiteral } from "./search-terms";
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
 * Regions matching the typed terms (ADR-047). The place's name must match one term (substring or
 * a close spelling: "singorejo" also finds Singorojo); the other terms may match it or its
 * ancestors, so "beji, depok" finds Beji in Kota Depok and "pelem, boyolali" Pelem in Simo.
 * Results matching every term come first, then exact names (without "Kabupaten"/"Kota"), wider
 * areas, prefixes and similarity. `terms` come from `parseRegionQuery` and `levels` are sorted,
 * so the cache key is stable. Candidates come from the trigram index on `regions.name`.
 */
export async function searchRegions(
  terms: readonly string[],
  levels: readonly RegionLevel[],
  limit: number,
): Promise<RegionSearchResult[]> {
  "use cache";
  cacheTag(cacheTags.regions);
  cacheLife("days");

  // A term matches a name as a substring, or as a close spelling of the name without
  // "Kabupaten"/"Kota" (else "kabupaten bogor" would also find Kabupaten Bone).
  const matches = (term: string, column: SQL) =>
    sql`(${column} ilike ${`%${likeLiteral(term)}%`} or ${fuzzyTerm(term)} <% ${column})`;
  // One condition per term, so Postgres combines index scans (BitmapOr).
  const nameMatches = sql.join(
    terms.map((term) => matches(term, sql`r.name`)),
    sql` or `,
  );
  const placeMatches = (term: string) =>
    sql.join(
      [sql`r.name`, sql`p1.name`, sql`p2.name`, sql`p3.name`].map((column) =>
        matches(term, column),
      ),
      sql` or `,
    );
  const matched = sql.join(
    terms.map((term) => sql`(case when ${placeMatches(term)} then 1 else 0 end)`),
    sql` + `,
  );
  const exact = sql.join(
    terms.map(
      (term) =>
        sql`(lower(r.name) = ${term}
          or regexp_replace(lower(r.name), '^(kabupaten|kota|kota administrasi) ', '') = ${term})`,
    ),
    sql` or `,
  );
  const prefix = sql.join(
    terms.map((term) => sql`r.name ilike ${`${likeLiteral(term)}%`}`),
    sql` or `,
  );
  const similarity = sql`greatest(${sql.join(
    terms.map((term) => sql`word_similarity(${fuzzyTerm(term)}, r.name)`),
    sql`, `,
  )})`;

  const rows = await db.execute<{
    code: string;
    name: string;
    level: RegionLevel;
    parent: string | null;
    grandparent: string | null;
    root: string | null;
    matched: number;
  }>(sql`
    select r.code, r.name, r.level, p1.name as parent, p2.name as grandparent, p3.name as root,
      (${matched})::int as matched
    from ${regions} r
    left join ${regions} p1 on p1.code = r.parent_code
    left join ${regions} p2 on p2.code = p1.parent_code
    left join ${regions} p3 on p3.code = p2.parent_code
    where r.level in (${sql.join(
      levels.map((level) => sql`${level}::region_level`),
      sql`, `,
    )})
      and (${nameMatches})
    order by
      matched desc,
      -- The name without "Kabupaten"/"Kota" equals a term: "depok" puts Kota Depok first.
      (${exact}) desc,
      -- Then wider areas first: a city before its districts and villages of the same name.
      array_position(array['province', 'regency', 'district', 'village']::region_level[], r.level),
      (${prefix}) desc,
      ${similarity} desc,
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
    matchesAll: row.matched === terms.length,
  }));
}
