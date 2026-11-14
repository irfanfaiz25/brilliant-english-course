import "server-only";

import { and, asc, eq, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { limits } from "@/config/limits";
import { db } from "@/db/client";
import { programLevels, regions, unitLevels, units } from "@/db/schema";
import { shortRegionName } from "@/features/regions/service";
import type { SessionUser } from "@/features/users/schema";
import { assertCan } from "@/lib/permissions";

import type { LevelSlug } from "@/features/programs/schema";

import type { EnrollmentStatus, UnitFormInput, UnitStatus } from "./schema";
import { timeOfDay } from "./service";

/*
 * Admin reads of units: every live unit whatever its status, uncached and permission-checked
 * (data access layer, ADR-025). Deleted units stay out of every list.
 */

const village = alias(regions, "village");
const regency = alias(regions, "regency");
const isLive = isNull(units.deletedAt);

export type AdminUnitFilter = {
  /** Name, code or slug, case-insensitive. */
  query: string;
  status: UnitStatus | null;
  /** 1-based. */
  page: number;
};

export type AdminUnitRow = {
  id: string;
  code: string;
  name: string;
  status: UnitStatus;
  enrollment: EnrollmentStatus;
  village: string;
  regency: string;
  studentsCount: number;
  levels: LevelSlug[];
};

export type AdminUnitList = {
  rows: AdminUnitRow[];
  total: number;
  pageCount: number;
  /** Live units per status, for the filter chips (unaffected by the filter itself). */
  counts: Record<UnitStatus | "all", number>;
};

async function levelsOf(unitIds: readonly string[]): Promise<Map<string, LevelSlug[]>> {
  if (unitIds.length === 0) return new Map();
  const rows = await db
    .select({ unitId: unitLevels.unitId, slug: programLevels.slug })
    .from(unitLevels)
    .innerJoin(programLevels, eq(programLevels.id, unitLevels.levelId))
    .where(inArray(unitLevels.unitId, [...unitIds]))
    .orderBy(asc(programLevels.sortOrder));
  const byUnit = new Map<string, LevelSlug[]>();
  for (const row of rows) {
    byUnit.set(row.unitId, [...(byUnit.get(row.unitId) ?? []), row.slug as LevelSlug]);
  }
  return byUnit;
}

/** One page of live units matching the filter, by name, with the status counts. */
export async function getAdminUnits(
  actor: SessionUser,
  { query, status, page }: AdminUnitFilter,
): Promise<AdminUnitList> {
  assertCan(actor, "read", "units");
  // `%` and `_` typed by the admin are literal characters, not wildcards.
  const search = query.trim().replace(/[\\%_]/g, "\\$&");
  const matches: SQL | undefined = search
    ? or(
        ilike(units.name, `%${search}%`),
        ilike(units.code, `%${search}%`),
        ilike(units.slug, `%${search}%`),
      )
    : undefined;
  const where = and(isLive, matches, status ? eq(units.status, status) : undefined);
  const pageSize = limits.units.pageSize;

  const [rows, [totalRow], statusRows] = await Promise.all([
    db
      .select({
        id: units.id,
        code: units.code,
        name: units.name,
        status: units.status,
        enrollment: units.enrollment,
        studentsCount: units.studentsCount,
        village: village.name,
        regency: regency.name,
      })
      .from(units)
      .innerJoin(village, eq(village.code, units.villageCode))
      .innerJoin(regency, sql`${regency.code} = left(${units.villageCode}, 5)`)
      .where(where)
      .orderBy(asc(units.name))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(units)
      .where(where),
    db
      .select({ status: units.status, count: sql<number>`count(*)::int` })
      .from(units)
      .where(and(isLive, matches))
      .groupBy(units.status),
  ]);
  const levels = await levelsOf(rows.map((row) => row.id));
  const total = totalRow?.count ?? 0;
  const counts = { all: 0, onboarding: 0, active: 0, inactive: 0 };
  for (const row of statusRows) {
    counts[row.status] = row.count;
    counts.all += row.count;
  }

  return {
    rows: rows.map((row) => ({
      ...row,
      village: shortRegionName(row.village),
      regency: shortRegionName(row.regency),
      levels: levels.get(row.id) ?? [],
    })),
    total,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    counts,
  };
}

export type UnitForEdit = {
  values: UnitFormInput;
  code: string;
  updatedAt: Date;
};

/** One live unit as form values, or `null` when it does not exist (or was deleted). */
export async function getUnitForEdit(actor: SessionUser, id: string): Promise<UnitForEdit | null> {
  assertCan(actor, "read", "units");
  const [unit] = await db
    .select()
    .from(units)
    .where(and(eq(units.id, id), isLive));
  if (!unit) return null;
  const levels = await levelsOf([id]);
  return {
    code: unit.code,
    updatedAt: unit.updatedAt,
    values: {
      name: unit.name,
      slug: unit.slug,
      status: unit.status,
      enrollment: unit.enrollment,
      villageCode: unit.villageCode,
      address: unit.address,
      latitude: unit.latitude,
      longitude: unit.longitude,
      managerName: unit.managerName,
      whatsapp: unit.whatsapp,
      openDays: unit.openDays,
      opensAt: timeOfDay(unit.opensAt),
      closesAt: timeOfDay(unit.closesAt),
      levels: levels.get(id) ?? [],
      studentsCount: unit.studentsCount,
      openedAt: unit.openedAt ?? "",
    },
  };
}
