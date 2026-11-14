import "server-only";

import { and, asc, countDistinct, desc, eq, isNull, sql, sum } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";
import { db } from "@/db/client";
import { programLevels, regions, unitLevels, units } from "@/db/schema";
import { getRegionsByCodes } from "@/features/regions/queries";
import { regionCodePath, shortRegionName } from "@/features/regions/service";

import { buildUnitDirectory, type UnitDirectory } from "./directory";
import type { NetworkStats, UnitSummary } from "./schema";
import { timeOfDay } from "./service";

/** Units shown on the public site: active and not deleted. */
const isPublic = and(eq(units.status, "active"), isNull(units.deletedAt));

const district = alias(regions, "district");
const regency = alias(regions, "regency");

/** Totals across the unit network, always computed from data (AGENTS.md § 4). */
export async function getNetworkStats(): Promise<NetworkStats> {
  "use cache";
  cacheTag(cacheTags.units);
  cacheLife("hours");
  const [row] = await db
    .select({
      activeUnits: sql<number>`count(*)::int`,
      // Regency code = first 5 characters of the village code ("32.01").
      cities: countDistinct(sql`left(${units.villageCode}, 5)`),
      students: sum(units.studentsCount).mapWith(Number),
    })
    .from(units)
    .where(isPublic);
  return {
    activeUnits: row?.activeUnits ?? 0,
    cities: row?.cities ?? 0,
    students: row?.students ?? 0,
  };
}

/** Every public unit with its district/regency names and levels, newest first. */
async function loadPublicUnits(): Promise<UnitSummary[]> {
  const [rows, levels] = await Promise.all([
    db
      .select({
        unit: units,
        districtName: district.name,
        regencyName: regency.name,
      })
      .from(units)
      .innerJoin(district, sql`${district.code} = left(${units.villageCode}, 8)`)
      .innerJoin(regency, sql`${regency.code} = left(${units.villageCode}, 5)`)
      .where(isPublic)
      .orderBy(desc(units.openedAt), asc(units.name)),
    db
      .select({ unitId: unitLevels.unitId, slug: programLevels.slug })
      .from(unitLevels)
      .innerJoin(programLevels, eq(programLevels.id, unitLevels.levelId))
      .orderBy(asc(programLevels.sortOrder)),
  ]);

  const levelsByUnit = new Map<string, UnitSummary["levels"]>();
  for (const level of levels) {
    const list = levelsByUnit.get(level.unitId) ?? [];
    list.push(level.slug as UnitSummary["levels"][number]);
    levelsByUnit.set(level.unitId, list);
  }

  return rows.flatMap(({ unit, districtName, regencyName }) => {
    const unitLevelSlugs = levelsByUnit.get(unit.id) ?? [];
    // A unit without levels has nothing to offer parents yet; admin validation prevents it later.
    if (unitLevelSlugs.length === 0) return [];
    return [
      {
        code: unit.code,
        slug: unit.slug,
        name: unit.name,
        address: unit.address,
        district: shortRegionName(districtName),
        regency: shortRegionName(regencyName),
        villageCode: unit.villageCode,
        location: { lat: unit.latitude, lng: unit.longitude },
        manager: unit.managerName,
        whatsapp: unit.whatsapp,
        openDays: unit.openDays,
        opensAt: timeOfDay(unit.opensAt),
        closesAt: timeOfDay(unit.closesAt),
        levels: unitLevelSlugs,
        enrollment: unit.enrollment,
      },
    ];
  });
}

/** All active units shown on the public site, newest first. */
export async function getActiveUnits(): Promise<UnitSummary[]> {
  "use cache";
  cacheTag(cacheTags.units);
  cacheLife("hours");
  return loadPublicUnits();
}

/** A few units to preview on the home page: the most recently opened ones. */
export async function getFeaturedUnits(limit = 2): Promise<UnitSummary[]> {
  return (await getActiveUnits()).slice(0, limit);
}

/**
 * Active units grouped by province and regency with their page paths (`/unit/…`), cached under
 * the units and regions tags.
 */
export async function getUnitDirectory(): Promise<UnitDirectory> {
  "use cache";
  cacheTag(cacheTags.units, cacheTags.regions);
  cacheLife("hours");
  const activeUnits = await getActiveUnits();
  const codes = [
    ...new Set(activeUnits.flatMap((unit) => regionCodePath(unit.villageCode).slice(0, 2))),
  ];
  return buildUnitDirectory(activeUnits, await getRegionsByCodes(codes));
}
