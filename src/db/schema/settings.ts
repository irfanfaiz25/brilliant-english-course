import { jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { users } from "./users";

/**
 * Site settings as one JSON document per key (`contact`, `partnership`, `quota`, `seo`,
 * `notifications`, …). Each key has a Zod schema and code defaults in `features/settings`, so a
 * missing row falls back to the defaults and a new setting needs no migration.
 */
export const settings = pgTable("settings", {
  key: varchar({ length: 64 }).primaryKey(),
  value: jsonb().$type<unknown>().notNull(),
  updatedById: uuid().references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type SettingRow = typeof settings.$inferSelect;
