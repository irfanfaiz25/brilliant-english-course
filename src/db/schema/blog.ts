import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { postCategories, postStatuses } from "../../config/enums";
import type { RichTextDoc } from "../../features/blog/schema";
import { id, localeEnum, softDelete, timestamps } from "./_helpers";
import { mediaAssets } from "./media";

export const postCategoryEnum = pgEnum("post_category", postCategories);
export const postStatusEnum = pgEnum("post_status", postStatuses);

/** Blog posts; the body lives per locale in `post_translations` as a Tiptap document (ADR-019). */
export const posts = pgTable(
  "posts",
  {
    id: id(),
    category: postCategoryEnum().notNull(),
    status: postStatusEnum().notNull().default("draft"),
    coverImageId: uuid().references(() => mediaAssets.id, { onDelete: "set null" }),
    authorName: varchar({ length: 120 }).notNull(),
    authorRole: varchar({ length: 120 }).notNull(),
    publishedAt: timestamp({ withTimezone: true }),
    ...timestamps,
    ...softDelete,
  },
  (table) => [index("posts_status_published_at_idx").on(table.status, table.publishedAt)],
);

export const postTranslations = pgTable(
  "post_translations",
  {
    postId: uuid()
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    locale: localeEnum().notNull(),
    /** Localized slug; `/blog/[slug]` resolves it per locale. */
    slug: varchar({ length: 160 }).notNull(),
    title: varchar({ length: 110 }).notNull(),
    excerpt: varchar({ length: 200 }).notNull(),
    coverAlt: varchar({ length: 200 }).notNull().default(""),
    /** Validated with `richTextDocSchema` before every write. */
    content: jsonb().$type<RichTextDoc>().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.locale] }),
    uniqueIndex("post_translations_locale_slug_idx").on(table.locale, table.slug),
  ],
);

export type PostRow = typeof posts.$inferSelect;
export type PostTranslationRow = typeof postTranslations.$inferSelect;
