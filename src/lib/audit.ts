import { createHmac } from "node:crypto";

import type { Database } from "@/db/client";
import { auditLog } from "@/db/schema";
import { env } from "@/lib/env";

/** A database handle or an open transaction, so the audit row commits with the change. */
type Executor = Pick<Database, "insert">;

export type AuditEntry = {
  /** `null` for public submissions, the worker and scripts. */
  actorId: string | null;
  /** Dotted verb, e.g. "lead.create", "unit.update". */
  action: string;
  entityType: string;
  entityId: string;
  /** Changed fields; never secrets or full personal records. */
  changes?: Record<string, unknown>;
  ipHash?: string | null;
};

/** Appends one row to `audit_log` (AGENTS.md § 4: every mutation writes one). */
export async function writeAuditLog(executor: Executor, entry: AuditEntry): Promise<void> {
  await executor.insert(auditLog).values({ ...entry, ipHash: entry.ipHash ?? null });
}

/**
 * Keyed hash of a client IP: lets admins spot repeated abuse from one address without storing
 * the address itself. Unknown or local addresses are not hashed.
 */
export function hashIp(ip: string): string | null {
  if (ip === "unknown") return null;
  return createHmac("sha256", env.BETTER_AUTH_SECRET).update(ip).digest("hex");
}
