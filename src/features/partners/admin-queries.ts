import "server-only";

import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/db/client";
import { partnerLeads, regions } from "@/db/schema";
import { shortRegionName } from "@/features/regions/service";
import type { SessionUser } from "@/features/users/schema";
import { assertCan } from "@/lib/permissions";

import type { LeadStatus } from "./schema";

/*
 * Admin reads of partner leads. Never cached across users: every call checks the caller's
 * permission first (data access layer, ADR-025).
 */

export type LeadListItem = {
  id: string;
  reference: string;
  fullName: string;
  village: string;
  regency: string;
  status: LeadStatus;
  createdAt: Date;
};

const village = alias(regions, "village");
const regency = alias(regions, "regency");
const isLive = isNull(partnerLeads.deletedAt);

/** Leads created in the last `days` days. */
export async function countRecentLeads(actor: SessionUser, days = 7): Promise<number> {
  assertCan(actor, "read", "leads");
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(partnerLeads)
    .where(and(isLive, gt(partnerLeads.createdAt, sql`now() - make_interval(days => ${days})`)));
  return row?.count ?? 0;
}

/** The newest leads with their village and regency names. */
export async function getLatestLeads(actor: SessionUser, limit = 5): Promise<LeadListItem[]> {
  assertCan(actor, "read", "leads");
  const rows = await db
    .select({
      id: partnerLeads.id,
      reference: partnerLeads.reference,
      fullName: partnerLeads.fullName,
      status: partnerLeads.status,
      createdAt: partnerLeads.createdAt,
      village: village.name,
      regency: regency.name,
    })
    .from(partnerLeads)
    .innerJoin(village, eq(village.code, partnerLeads.villageCode))
    .innerJoin(regency, sql`${regency.code} = left(${partnerLeads.villageCode}, 5)`)
    .where(isLive)
    .orderBy(desc(partnerLeads.createdAt))
    .limit(limit);
  return rows.map((row) => ({
    ...row,
    village: shortRegionName(row.village),
    regency: shortRegionName(row.regency),
  }));
}
