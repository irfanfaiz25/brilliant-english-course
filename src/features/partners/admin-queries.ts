import "server-only";

import { and, asc, desc, eq, gt, ilike, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { limits } from "@/config/limits";
import {
  auditLog,
  partnerLeadNotes,
  partnerLeads,
  quotaReservations,
  regions,
  units,
  users,
} from "@/db/schema";
import { db } from "@/db/client";
import { openReservation } from "@/features/quota/service";
import { shortRegionName } from "@/features/regions/service";
import { userRoles, type SessionUser } from "@/features/users/schema";
import type { Locale } from "@/i18n/routing";
import { assertCan, can } from "@/lib/permissions";

import {
  isOpenLeadStatus,
  leadStatuses,
  openLeadStatuses,
  type LeadStatus,
  type PartnerBackground,
  type PartnerSpace,
} from "./schema";

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

/* ------------------------------------------------------------------------------------------------
 * Pipeline (Phase 4d)
 * ---------------------------------------------------------------------------------------------- */

const district = alias(regions, "district");
const province = alias(regions, "province");
const assignee = alias(users, "assignee");

export type LeadFilter = {
  /** Name, reference or WhatsApp digits, case-insensitive. */
  query: string;
  /** A status, "open" (still being worked) or `null` for every lead. */
  status: LeadStatus | "open" | null;
  /** Only leads assigned to the caller. */
  mine: boolean;
  /** 1-based. */
  page: number;
};

export type PipelineLead = LeadListItem & {
  whatsapp: string;
  background: PartnerBackground;
  assignee: string | null;
};

export type PipelineList = {
  rows: PipelineLead[];
  total: number;
  pageCount: number;
  /** Live leads per status (with the search and "mine" applied, not the status itself). */
  counts: Record<LeadStatus | "all" | "open", number>;
};

function statusCondition(status: LeadFilter["status"]) {
  if (status === null) return undefined;
  if (status === "open") return inArray(partnerLeads.status, [...openLeadStatuses]);
  return eq(partnerLeads.status, status);
}

function filterWhere(actor: SessionUser, { query, status, mine }: LeadFilter, withStatus = true) {
  // `%` and `_` typed by the admin are literal characters, not wildcards.
  const search = query.trim().replace(/[\\%_]/g, "\\$&");
  const digits = query.replace(/\D/g, "");
  return and(
    isLive,
    search
      ? or(
          ilike(partnerLeads.fullName, `%${search}%`),
          ilike(partnerLeads.reference, `%${search}%`),
          digits.length >= 4 ? ilike(partnerLeads.whatsapp, `%${digits}%`) : undefined,
        )
      : undefined,
    mine ? eq(partnerLeads.assignedToId, actor.id) : undefined,
    withStatus ? statusCondition(status) : undefined,
  );
}

function pipelineQuery() {
  return db
    .select({
      id: partnerLeads.id,
      reference: partnerLeads.reference,
      fullName: partnerLeads.fullName,
      whatsapp: partnerLeads.whatsapp,
      background: partnerLeads.background,
      status: partnerLeads.status,
      createdAt: partnerLeads.createdAt,
      village: village.name,
      regency: regency.name,
      assignee: assignee.name,
    })
    .from(partnerLeads)
    .innerJoin(village, eq(village.code, partnerLeads.villageCode))
    .innerJoin(regency, sql`${regency.code} = left(${partnerLeads.villageCode}, 5)`)
    .leftJoin(assignee, eq(assignee.id, partnerLeads.assignedToId));
}

const toPipelineLead = (row: Awaited<ReturnType<typeof pipelineQuery>>[number]): PipelineLead => ({
  ...row,
  village: shortRegionName(row.village),
  regency: shortRegionName(row.regency),
});

/** One page of the pipeline, newest first, with counts for the status chips. */
export async function getPipeline(actor: SessionUser, filter: LeadFilter): Promise<PipelineList> {
  assertCan(actor, "read", "leads");
  const pageSize = limits.leads.pageSize;
  const where = filterWhere(actor, filter);
  const [rows, [totalRow], statusRows] = await Promise.all([
    pipelineQuery()
      .where(where)
      .orderBy(desc(partnerLeads.createdAt))
      .limit(pageSize)
      .offset((filter.page - 1) * pageSize),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(partnerLeads)
      .where(where),
    db
      .select({ status: partnerLeads.status, count: sql<number>`count(*)::int` })
      .from(partnerLeads)
      .where(filterWhere(actor, filter, false))
      .groupBy(partnerLeads.status),
  ]);

  const counts = Object.fromEntries(
    [...leadStatuses, "all", "open"].map((key) => [key, 0]),
  ) as PipelineList["counts"];
  for (const row of statusRows) {
    counts[row.status] = row.count;
    counts.all += row.count;
    if (isOpenLeadStatus(row.status)) counts.open += row.count;
  }
  const total = totalRow?.count ?? 0;
  return {
    rows: rows.map(toPipelineLead),
    total,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    counts,
  };
}

export type LeadExportRow = PipelineLead & {
  email: string | null;
  space: PartnerSpace;
  motivation: string;
  district: string;
  province: string;
};

/** Every lead matching the filter (no paging, capped) for the CSV export. */
export async function getLeadsForExport(
  actor: SessionUser,
  filter: LeadFilter,
): Promise<LeadExportRow[]> {
  assertCan(actor, "read", "leads");
  const rows = await db
    .select({
      id: partnerLeads.id,
      reference: partnerLeads.reference,
      fullName: partnerLeads.fullName,
      whatsapp: partnerLeads.whatsapp,
      email: partnerLeads.email,
      background: partnerLeads.background,
      space: partnerLeads.space,
      motivation: partnerLeads.motivation,
      status: partnerLeads.status,
      createdAt: partnerLeads.createdAt,
      village: village.name,
      district: district.name,
      regency: regency.name,
      province: province.name,
      assignee: assignee.name,
    })
    .from(partnerLeads)
    .innerJoin(village, eq(village.code, partnerLeads.villageCode))
    .innerJoin(district, sql`${district.code} = left(${partnerLeads.villageCode}, 8)`)
    .innerJoin(regency, sql`${regency.code} = left(${partnerLeads.villageCode}, 5)`)
    .innerJoin(province, sql`${province.code} = left(${partnerLeads.villageCode}, 2)`)
    .leftJoin(assignee, eq(assignee.id, partnerLeads.assignedToId))
    .where(filterWhere(actor, filter))
    .orderBy(desc(partnerLeads.createdAt))
    .limit(limits.leads.exportMax);
  return rows.map((row) => ({
    ...row,
    village: shortRegionName(row.village),
    district: shortRegionName(row.district),
    regency: shortRegionName(row.regency),
    province: shortRegionName(row.province),
  }));
}

export type LeadDetail = {
  id: string;
  reference: string;
  fullName: string;
  whatsapp: string;
  email: string | null;
  background: PartnerBackground;
  space: PartnerSpace;
  motivation: string;
  locale: Locale;
  status: LeadStatus;
  assignedToId: string | null;
  createdAt: Date;
  updatedAt: Date;
  villageCode: string;
  place: { village: string; district: string; regency: string; province: string };
  unit: { id: string; code: string; name: string } | null;
  /** The slot held while the lead is onboarding, if any. */
  reservationId: string | null;
};

/** One live lead with its place, linked unit and held slot, or `null`. */
export async function getLeadDetail(actor: SessionUser, id: string): Promise<LeadDetail | null> {
  assertCan(actor, "read", "leads");
  const [row] = await db
    .select({
      lead: partnerLeads,
      village: village.name,
      district: district.name,
      regency: regency.name,
      province: province.name,
      unitId: units.id,
      unitCode: units.code,
      unitName: units.name,
    })
    .from(partnerLeads)
    .innerJoin(village, eq(village.code, partnerLeads.villageCode))
    .innerJoin(district, sql`${district.code} = left(${partnerLeads.villageCode}, 8)`)
    .innerJoin(regency, sql`${regency.code} = left(${partnerLeads.villageCode}, 5)`)
    .innerJoin(province, sql`${province.code} = left(${partnerLeads.villageCode}, 2)`)
    .leftJoin(units, eq(units.id, partnerLeads.unitId))
    .where(and(eq(partnerLeads.id, id), isLive));
  if (!row) return null;
  const [reservation] = await db
    .select({ id: quotaReservations.id })
    .from(quotaReservations)
    .where(and(eq(quotaReservations.leadId, id), openReservation))
    .limit(1);
  const { lead } = row;
  return {
    id: lead.id,
    reference: lead.reference,
    fullName: lead.fullName,
    whatsapp: lead.whatsapp,
    email: lead.email,
    background: lead.background,
    space: lead.space,
    motivation: lead.motivation,
    locale: lead.locale,
    status: lead.status,
    assignedToId: lead.assignedToId,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
    villageCode: lead.villageCode,
    place: {
      village: shortRegionName(row.village),
      district: shortRegionName(row.district),
      regency: shortRegionName(row.regency),
      province: shortRegionName(row.province),
    },
    unit:
      row.unitId && row.unitCode && row.unitName
        ? { id: row.unitId, code: row.unitCode, name: row.unitName }
        : null,
    reservationId: reservation?.id ?? null,
  };
}

/** One entry of a lead's history: a staff note or a recorded change. */
export type LeadTimelineEntry =
  | { kind: "note"; id: string; at: Date; author: string | null; body: string }
  | {
      kind: "event";
      id: string;
      at: Date;
      author: string | null;
      action: string;
      changes: Record<string, unknown> | null;
    };

/** Notes and audit events of a lead, newest first. */
export async function getLeadTimeline(
  actor: SessionUser,
  id: string,
): Promise<LeadTimelineEntry[]> {
  assertCan(actor, "read", "leads");
  const author = alias(users, "author");
  const [notes, events] = await Promise.all([
    db
      .select({
        id: partnerLeadNotes.id,
        at: partnerLeadNotes.createdAt,
        author: author.name,
        body: partnerLeadNotes.body,
      })
      .from(partnerLeadNotes)
      .leftJoin(author, eq(author.id, partnerLeadNotes.authorId))
      .where(eq(partnerLeadNotes.leadId, id)),
    db
      .select({
        id: auditLog.id,
        at: auditLog.createdAt,
        author: author.name,
        action: auditLog.action,
        changes: auditLog.changes,
      })
      .from(auditLog)
      .leftJoin(author, eq(author.id, auditLog.actorId))
      // Notes have their own entries; their audit rows would only repeat them.
      .where(
        and(
          eq(auditLog.entityType, "partner_lead"),
          eq(auditLog.entityId, id),
          ne(auditLog.action, "lead.note"),
        ),
      ),
  ]);
  return [
    ...notes.map((note) => ({ kind: "note" as const, ...note })),
    ...events.map((event) => ({ kind: "event" as const, ...event })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());
}

export type StaffOption = { id: string; name: string; email: string };

/** Active staff who may work leads (the assignee choices). */
export async function getLeadAssignees(actor: SessionUser): Promise<StaffOption[]> {
  assertCan(actor, "read", "leads");
  const roles = userRoles.filter((role) =>
    can({ role, unitId: null, isActive: true }, "update", "leads"),
  );
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(and(eq(users.isActive, true), inArray(users.role, roles)))
    .orderBy(asc(users.name));
}
