import { sql } from "drizzle-orm";
import { boolean, pgEnum, pgTable, text, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { userRoles } from "../../config/enums";
import { id, timestamps } from "./_helpers";
import { units } from "./units";

export const userRoleEnum = pgEnum("user_role", userRoles);

/**
 * Staff and partner accounts. Columns follow Better Auth's core user model so Phase 3b can plug
 * the library in; its session, account and verification tables arrive with it.
 */
export const users = pgTable(
  "users",
  {
    id: id(),
    name: varchar({ length: 120 }).notNull(),
    email: varchar({ length: 254 }).notNull(),
    emailVerified: boolean().notNull().default(false),
    image: text(),
    role: userRoleEnum().notNull().default("editor"),
    /** Required for `mitra`: every permission is scoped to this unit (ADR-006). */
    unitId: uuid().references(() => units.id, { onDelete: "set null" }),
    /** Deactivated accounts keep their history but cannot sign in. */
    isActive: boolean().notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex("users_email_idx").on(sql`lower(${table.email})`)],
);

export type UserRow = typeof users.$inferSelect;
