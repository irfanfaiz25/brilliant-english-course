import "server-only";

import { and, asc, desc, eq, gt, isNull, lte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/db/client";
import { partnerLeads, quotaReservations, regions, units, users } from "@/db/schema";
import { shortRegionName } from "@/features/regions/service";
import type { SessionUser } from "@/features/users/schema";
import { assertCan } from "@/lib/permissions";

import type { QuotaRules, VillageQuota } from "./schema";
import { activeUnit, openReservation, quotaFromCounts, villageUsage } from "./service";

/*
 * Admin reads of the partnership quota: uncached and permission-checked (ADR-025). Numbers are
 * always computed from units and reservations, never stored.
 */

const village = alias(regions, "village");
const district = alias(regions, "district");
const regency = alias(regions, "regency");

type Place = { village: string; district: string; regency: string };

const placeColumns = { village: village.name, district: district.name, regency: regency.name };
const shortPlace = (row: Place): Place => ({
  village: shortRegionName(row.village),
  district: shortRegionName(row.district),
  regency: shortRegionName(row.regency),
});

export type VillageQuotaRow = VillageQuota & Place;

/**
 * Every village that holds an active unit or an open reservation, fullest first, so staff see
 * where the network is crowded.
 */
export async function getOccupiedVillages(
  actor: SessionUser,
  rules: QuotaRules,
): Promise<VillageQuotaRow[]> {
  assertCan(actor, "read", "quota");
  const unitCounts = db
    .select({
      villageCode: units.villageCode,
      activeUnits: sql<number>`count(*)::int`.as("active_units"),
      reserved: sql<number>`0`.as("reserved"),
    })
    .from(units)
    .where(activeUnit)
    .groupBy(units.villageCode);
  const reservationCounts = db
    .select({
      villageCode: quotaReservations.villageCode,
      activeUnits: sql<number>`0`.as("active_units"),
      reserved: sql<number>`sum(${quotaReservations.slots})::int`.as("reserved"),
    })
    .from(quotaReservations)
    .where(openReservation)
    .groupBy(quotaReservations.villageCode);
  const usage = unitCounts.unionAll(reservationCounts).as("usage");

  const rows = await db
    .select({
      villageCode: usage.villageCode,
      activeUnits: sql<number>`sum(${usage.activeUnits})::int`,
      reserved: sql<number>`sum(${usage.reserved})::int`,
      ...placeColumns,
    })
    .from(usage)
    .innerJoin(village, eq(village.code, usage.villageCode))
    .innerJoin(district, sql`${district.code} = left(${usage.villageCode}, 8)`)
    .innerJoin(regency, sql`${regency.code} = left(${usage.villageCode}, 5)`)
    .groupBy(usage.villageCode, village.name, district.name, regency.name);

  return rows
    .map((row) => ({
      ...quotaFromCounts(row.villageCode, row.activeUnits, row.reserved, rules),
      ...shortPlace(row),
    }))
    .sort((a, b) => a.remaining - b.remaining || a.village.localeCompare(b.village, "id"));
}

export type ReservationRow = Place & {
  id: string;
  villageCode: string;
  slots: number;
  note: string;
  expiresAt: Date | null;
  createdAt: Date;
  createdBy: string | null;
  leadReference: string | null;
};

const reservationColumns = {
  id: quotaReservations.id,
  villageCode: quotaReservations.villageCode,
  slots: quotaReservations.slots,
  note: quotaReservations.note,
  expiresAt: quotaReservations.expiresAt,
  createdAt: quotaReservations.createdAt,
  createdBy: users.name,
  leadReference: partnerLeads.reference,
};

function reservationsQuery() {
  return db
    .select({ ...reservationColumns, ...placeColumns })
    .from(quotaReservations)
    .innerJoin(village, eq(village.code, quotaReservations.villageCode))
    .innerJoin(district, sql`${district.code} = left(${quotaReservations.villageCode}, 8)`)
    .innerJoin(regency, sql`${regency.code} = left(${quotaReservations.villageCode}, 5)`)
    .leftJoin(users, eq(users.id, quotaReservations.createdById))
    .leftJoin(partnerLeads, eq(partnerLeads.id, quotaReservations.leadId));
}

/** Reservations still holding slots, the ones ending soonest first (no end date last). */
export async function getOpenReservations(actor: SessionUser): Promise<ReservationRow[]> {
  assertCan(actor, "read", "quota");
  const rows = await reservationsQuery()
    .where(openReservation)
    .orderBy(sql`${quotaReservations.expiresAt} asc nulls last`, desc(quotaReservations.createdAt));
  return rows.map((row) => ({ ...row, ...shortPlace(row) }));
}

/** How many reservations ended in the last 30 days (shown as a hint, never counted). */
export async function countRecentlyExpired(actor: SessionUser): Promise<number> {
  assertCan(actor, "read", "quota");
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(quotaReservations)
    .where(
      and(
        lte(quotaReservations.expiresAt, sql`now()`),
        gt(quotaReservations.expiresAt, sql`now() - interval '30 days'`),
      ),
    );
  return row?.count ?? 0;
}

export type VillageDetail = {
  quota: VillageQuota;
  place: Place;
  units: { id: string; code: string; name: string; status: string }[];
  reservations: ReservationRow[];
};

/** Quota of one village with the units and reservations behind the numbers. */
export async function getVillageDetail(
  actor: SessionUser,
  villageCode: string,
  rules: QuotaRules,
): Promise<VillageDetail | null> {
  assertCan(actor, "read", "quota");
  const [placeRow] = await db
    .select(placeColumns)
    .from(village)
    .innerJoin(district, sql`${district.code} = left(${village.code}, 8)`)
    .innerJoin(regency, sql`${regency.code} = left(${village.code}, 5)`)
    .where(eq(village.code, villageCode));
  if (!placeRow) return null;

  const [usage, unitRows, reservationRows] = await Promise.all([
    villageUsage(db, villageCode),
    db
      .select({ id: units.id, code: units.code, name: units.name, status: units.status })
      .from(units)
      .where(and(eq(units.villageCode, villageCode), isNull(units.deletedAt)))
      .orderBy(asc(units.name)),
    reservationsQuery()
      .where(and(eq(quotaReservations.villageCode, villageCode), openReservation))
      .orderBy(desc(quotaReservations.createdAt)),
  ]);

  return {
    quota: quotaFromCounts(villageCode, usage.activeUnits, usage.reserved, rules),
    place: shortPlace(placeRow),
    units: unitRows,
    reservations: reservationRows.map((row) => ({ ...row, ...shortPlace(row) })),
  };
}
