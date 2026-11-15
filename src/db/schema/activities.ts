import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  primaryKey,
  smallint,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

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
    /** Detail popup (ADR-042): a few sentences, what children do, skills practised, when. */
    description: text().notNull().default(""),
    highlights: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    skills: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    schedule: varchar({ length: 80 }).notNull().default(""),
  },
  (table) => [primaryKey({ columns: [table.activityId, table.locale] })],
);

/** Photos of an activity shown in its detail popup, in order (ADR-042). */
export const activityPhotos = pgTable(
  "activity_photos",
  {
    id: id(),
    activityId: uuid()
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    mediaId: uuid()
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "cascade" }),
    sortOrder: smallint().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("activity_photos_activity_id_idx").on(table.activityId, table.sortOrder),
    index("activity_photos_media_id_idx").on(table.mediaId),
  ],
);

/** A photo's optional caption, per locale. */
export const activityPhotoTranslations = pgTable(
  "activity_photo_translations",
  {
    photoId: uuid()
      .notNull()
      .references(() => activityPhotos.id, { onDelete: "cascade" }),
    locale: localeEnum().notNull(),
    caption: varchar({ length: 80 }).notNull().default(""),
  },
  (table) => [primaryKey({ columns: [table.photoId, table.locale] })],
);

export type ActivityRow = typeof activities.$inferSelect;
export type ActivityTranslationRow = typeof activityTranslations.$inferSelect;
