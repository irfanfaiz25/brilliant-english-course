import { index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { id, timestamps } from "./_helpers";
import { users } from "./users";

/**
 * Better Auth's core tables (ADR-025), named in the plural like the rest of the schema and mapped
 * in `src/lib/auth.ts` through `modelName`. Column sets follow the library's core models; do not
 * rename fields without updating that mapping.
 */

/** One row per signed-in browser. `token` is the opaque value stored in the session cookie. */
export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text().notNull().unique(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ipAddress: varchar({ length: 64 }),
    userAgent: text(),
    ...timestamps,
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

/**
 * Sign-in methods of a user. Staff use email + password only (`provider_id = 'credential'`),
 * whose scrypt hash lives in `password`; the token columns exist for future OAuth providers.
 */
export const accounts = pgTable(
  "accounts",
  {
    id: id(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text().notNull(),
    providerId: varchar({ length: 40 }).notNull(),
    password: text(),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    ...timestamps,
  },
  (table) => [index("accounts_user_id_idx").on(table.userId)],
);

/** Short-lived tokens, e.g. password reset links (`identifier = 'reset-password:<token>'`). */
export const verifications = pgTable(
  "verifications",
  {
    id: id(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)],
);

export type SessionRow = typeof sessions.$inferSelect;
