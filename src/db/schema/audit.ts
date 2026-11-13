import { index, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { id } from "./_helpers";
import { users } from "./users";

/**
 * Who changed what. Every Server Action mutation appends one row (AGENTS.md § 4); the worker and
 * scripts may append with a `null` actor. Pruned on a schedule to keep storage small.
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: id(),
    actorId: uuid().references(() => users.id, { onDelete: "set null" }),
    /** Dotted verb, e.g. "unit.update", "lead.status_change", "settings.update". */
    action: varchar({ length: 64 }).notNull(),
    entityType: varchar({ length: 40 }).notNull(),
    entityId: varchar({ length: 160 }).notNull(),
    /** Changed fields as `{ before, after }`; never includes secrets. */
    changes: jsonb().$type<Record<string, unknown>>(),
    ipHash: varchar({ length: 64 }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_log_entity_idx").on(table.entityType, table.entityId, table.createdAt),
    index("audit_log_created_at_idx").on(table.createdAt),
  ],
);

export type AuditLogRow = typeof auditLog.$inferSelect;
