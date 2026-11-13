import { boolean, pgEnum, pgTable, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { seoEntityTypes } from "../../config/enums";
import { id, localeEnum, timestamps } from "./_helpers";
import { mediaAssets } from "./media";

export const seoEntityTypeEnum = pgEnum("seo_entity_type", seoEntityTypes);

/**
 * Admin metadata overrides, resolved as override → content-derived default → global default
 * (ADR-008). `entityId` is a route key for pages (`home`), otherwise the entity's slug or id.
 * Technical SEO (canonical, hreflang, sitemap, JSON-LD) stays in code.
 */
export const seoOverrides = pgTable(
  "seo_overrides",
  {
    id: id(),
    entityType: seoEntityTypeEnum().notNull(),
    entityId: varchar({ length: 160 }).notNull(),
    locale: localeEnum().notNull(),
    title: varchar({ length: 70 }),
    description: varchar({ length: 160 }),
    ogImageId: uuid().references(() => mediaAssets.id, { onDelete: "set null" }),
    /** Super-admin only (ADR-008). */
    noindex: boolean().notNull().default(false),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("seo_overrides_entity_idx").on(table.entityType, table.entityId, table.locale),
  ],
);

export type SeoOverrideRow = typeof seoOverrides.$inferSelect;
