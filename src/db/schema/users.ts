import { sql } from "drizzle-orm";
import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { userRoles } from "../../config/enums";
import { id, timestamps } from "./_helpers";
import { units } from "./units";

export const userRoleEnum = pgEnum("user_role", userRoles);

/**
 * Staff and partner accounts. Columns follow Better Auth's core user model (ADR-025); `role`,
 * `unit_id` and `is_active` are its additional fields and can never be set through sign-in input.
 * Better Auth stores emails lowercased; the unique index enforces it for direct writes too.
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
    /** Set when a session starts (Better Auth hook), shown in the Users module. */
    lastSignInAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (table) => [uniqueIndex("users_email_idx").on(sql`lower(${table.email})`)],
);

export type UserRow = typeof users.$inferSelect;
