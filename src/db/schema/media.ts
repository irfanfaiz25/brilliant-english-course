import { index, integer, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";

import { id, timestamps } from "./_helpers";
import { users } from "./users";

/**
 * Media library. `key` is the object key on Cloudflare R2 (Phase 4e) or, for the bundled
 * placeholders, the public path under `/public`. Alt text lives with the content that uses the
 * image, because it is localized and differs per use.
 */
export const mediaAssets = pgTable(
  "media_assets",
  {
    id: id(),
    key: text().notNull().unique(),
    /** Display name, from the uploaded file's name; searched in the library. */
    name: varchar({ length: 120 }).notNull().default(""),
    mimeType: varchar({ length: 100 }).notNull(),
    width: integer().notNull(),
    height: integer().notNull(),
    sizeBytes: integer(),
    uploadedById: uuid().references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [index("media_assets_created_at_idx").on(table.createdAt)],
);

export type MediaAssetRow = typeof mediaAssets.$inferSelect;
