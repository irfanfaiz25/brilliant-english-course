import { slugify } from "@/lib/slug";

import type { Region } from "@/features/regions/schema";
import type { UnitSummary } from "./schema";

/**
 * The public unit directory behind `/unit/[provinsi]/[kabupaten]/[unit]` (ADR-021): only areas
 * with at least one active unit exist, so every area page has real content to index.
 */
export type DirectoryUnit = UnitSummary & {
  /** URL segments: province, regency, unit. */
  path: [string, string, string];
};

export type DirectoryRegency = {
  code: string;
  name: string;
  slug: string;
  path: [string, string];
  units: DirectoryUnit[];
};

export type DirectoryProvince = {
  code: string;
  name: string;
  slug: string;
  path: [string];
  regencies: DirectoryRegency[];
  unitCount: number;
};

export type UnitDirectory = { provinces: DirectoryProvince[] };

export type DirectoryMatch =
  | { kind: "province"; province: DirectoryProvince }
  | { kind: "regency"; province: DirectoryProvince; regency: DirectoryRegency }
  | {
      kind: "unit";
      province: DirectoryProvince;
      regency: DirectoryRegency;
      unit: DirectoryUnit;
    };

const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name, "id");

/** Slugs unique among siblings: a repeated slug gets the code's digits appended. */
function uniqueSlugs<T>(
  items: readonly T[],
  slugOf: (item: T) => string,
  codeOf: (item: T) => string,
) {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(slugOf(item), (counts.get(slugOf(item)) ?? 0) + 1);
  return items.map((item) => {
    const slug = slugOf(item);
    return (counts.get(slug) ?? 0) > 1
      ? `${slug}-${codeOf(item)
          .replace(/[^0-9a-z]/gi, "")
          .toLowerCase()}`
      : slug;
  });
}

const groupBy = <T>(items: readonly T[], keyOf: (item: T) => string) => {
  const groups = new Map<string, T[]>();
  for (const item of items) groups.set(keyOf(item), [...(groups.get(keyOf(item)) ?? []), item]);
  return groups;
};

/**
 * Groups active units by province and regency (Kemendagri code prefixes) and assigns URL slugs.
 * Units whose province or regency is missing from `regions` are left out rather than guessed.
 */
export function buildUnitDirectory(
  units: readonly UnitSummary[],
  regions: readonly Region[],
): UnitDirectory {
  const regionByCode = new Map(regions.map((region) => [region.code, region]));
  const provinceCode = (unit: UnitSummary) => unit.villageCode.slice(0, 2);
  const regencyCode = (unit: UnitSummary) => unit.villageCode.slice(0, 5);

  const provinces = [...groupBy(units, provinceCode)]
    .flatMap(([code, provinceUnits]) => {
      const region = regionByCode.get(code);
      return region ? [{ region, units: provinceUnits }] : [];
    })
    .sort((a, b) => byName(a.region, b.region));
  const provinceSlugs = uniqueSlugs(
    provinces,
    (p) => slugify(p.region.name),
    (p) => p.region.code,
  );

  return {
    provinces: provinces.map(({ region, units: provinceUnits }, index) => {
      const provinceSlug = provinceSlugs[index] ?? slugify(region.name);

      const regencies = [...groupBy(provinceUnits, regencyCode)]
        .flatMap(([code, regencyUnits]) => {
          const regency = regionByCode.get(code);
          return regency ? [{ region: regency, units: regencyUnits }] : [];
        })
        .sort((a, b) => byName(a.region, b.region));
      const regencySlugs = uniqueSlugs(
        regencies,
        (r) => slugify(r.region.name),
        (r) => r.region.code,
      );

      const regencyNodes = regencies.map(
        ({ region: regency, units: regencyUnits }, regencyIndex) => {
          const regencySlug = regencySlugs[regencyIndex] ?? slugify(regency.name);
          const sorted = [...regencyUnits].sort(byName);
          const unitSlugs = uniqueSlugs(
            sorted,
            (unit) => unit.slug,
            (unit) => unit.code,
          );
          return {
            code: regency.code,
            name: regency.name,
            slug: regencySlug,
            path: [provinceSlug, regencySlug] as [string, string],
            units: sorted.map((unit, unitIndex) => ({
              ...unit,
              path: [provinceSlug, regencySlug, unitSlugs[unitIndex] ?? unit.slug] as [
                string,
                string,
                string,
              ],
            })),
          };
        },
      );

      return {
        code: region.code,
        name: region.name,
        slug: provinceSlug,
        path: [provinceSlug] as [string],
        regencies: regencyNodes,
        unitCount: regencyNodes.reduce((total, regency) => total + regency.units.length, 0),
      };
    }),
  };
}

/** Resolves `/unit/…` segments to a province, a regency or a unit; `null` when unknown. */
export function resolveDirectoryPath(
  directory: UnitDirectory,
  segments: readonly string[],
): DirectoryMatch | null {
  const [provinceSlug, regencySlug, unitSlug, ...rest] = segments;
  if (rest.length > 0 || !provinceSlug) return null;
  const province = directory.provinces.find((p) => p.slug === provinceSlug);
  if (!province) return null;
  if (!regencySlug) return { kind: "province", province };
  const regency = province.regencies.find((r) => r.slug === regencySlug);
  if (!regency) return null;
  if (!unitSlug) return { kind: "regency", province, regency };
  const unit = regency.units.find((u) => u.path[2] === unitSlug);
  return unit ? { kind: "unit", province, regency, unit } : null;
}

/** Every page path under `/unit`, for `generateStaticParams`. */
export function directoryPaths(directory: UnitDirectory): string[][] {
  return directory.provinces.flatMap((province) => [
    province.path,
    ...province.regencies.flatMap((regency) => [
      regency.path,
      ...regency.units.map((unit) => unit.path),
    ]),
  ]);
}

/** All units with their page paths, flattened. */
export function directoryUnits(directory: UnitDirectory): DirectoryUnit[] {
  return directory.provinces.flatMap((province) =>
    province.regencies.flatMap((regency) => regency.units),
  );
}

/** Unit code → page path, for linking cards that come from other lists (finder, home). */
export function unitPathsByCode(directory: UnitDirectory): Record<string, string[]> {
  return Object.fromEntries(directoryUnits(directory).map((unit) => [unit.code, unit.path]));
}
