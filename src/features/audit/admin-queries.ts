import "server-only";

import { desc, eq } from "drizzle-orm";

import { limits } from "@/config/limits";
import { db } from "@/db/client";
import { auditLog, users } from "@/db/schema";
import type { SessionUser } from "@/features/users/schema";
import { assertCan } from "@/lib/permissions";

/*
 * Reads of the audit log (`auditLog` grants: super admin and admin). The log is written by every
 * mutation (`lib/audit.ts`); this module only lists it.
 */

export type ActivityEntry = {
  id: string;
  /** Dotted verb, e.g. "lead.update". */
  action: string;
  entityType: string;
  entityId: string;
  /** Who did it; `null` for public submissions, scripts and the worker. */
  actorName: string | null;
  createdAt: Date;
};

/** The latest changes across the admin, newest first (Ringkasan, Phase 4h). */
export async function getRecentActivity(
  actor: SessionUser,
  limit: number = limits.overview.activity,
): Promise<ActivityEntry[]> {
  assertCan(actor, "read", "auditLog");
  return db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      actorName: users.name,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.actorId))
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);
}
