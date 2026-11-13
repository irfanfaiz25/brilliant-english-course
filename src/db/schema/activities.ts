import { boolean, pgTable, primaryKey, smallint, text, uuid, varchar } from "drizzle-orm/pg-core";

import { id, localeEnum, timestamps } from "./_helpers";
import { mediaAssets } from "./media";

/** Recurring unit activities (Story Telling Day, Market Day, …). */
export const activities = pgTable("activities", {
  id: id(),
  slug: varchar({ length: 80 }).notNull().unique(),
  imageId: uuid().references(() => mediaAssets.id, { onDelete: "set null" }),
  sortOrder: smallint().notNull().default(0),
  isPublished: boolean().notNull().default(true),
  ...timestamps,
});

export const activityTranslations = pgTable(
  "activity_translations",
  {
    activityId: uuid()
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    locale: localeEnum().notNull(),
    name: varchar({ length: 80 }).notNull(),
    summary: text().notNull(),
    /** Short audience label, e.g. "Semua level". */
    audience: varchar({ length: 60 }).notNull(),
    imageAlt: varchar({ length: 200 }).notNull().default(""),
  },
  (table) => [primaryKey({ columns: [table.activityId, table.locale] })],
);

export type ActivityRow = typeof activities.$inferSelect;
export type ActivityTranslationRow = typeof activityTranslations.$inferSelect;
