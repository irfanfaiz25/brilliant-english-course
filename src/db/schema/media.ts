import { integer, pgTable, text, varchar } from "drizzle-orm/pg-core";

import { id, timestamps } from "./_helpers";

/**
 * Media library. `key` is the object key on Cloudflare R2 (Phase 4e) or, for the bundled
 * placeholders, the public path under `/public`. Alt text lives with the content that uses the
 * image, because it is localized and differs per use.
 */
export const mediaAssets = pgTable("media_assets", {
  id: id(),
  key: text().notNull().unique(),
  mimeType: varchar({ length: 100 }).notNull(),
  width: integer().notNull(),
  height: integer().notNull(),
  sizeBytes: integer(),
  ...timestamps,
});

export type MediaAssetRow = typeof mediaAssets.$inferSelect;
