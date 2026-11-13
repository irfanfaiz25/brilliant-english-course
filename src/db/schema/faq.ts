import {
  boolean,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { faqTopics } from "../../config/enums";
import { id, localeEnum, timestamps } from "./_helpers";

export const faqTopicEnum = pgEnum("faq_topic", faqTopics);

export const faqItems = pgTable("faq_items", {
  id: id(),
  topic: faqTopicEnum().notNull(),
  sortOrder: smallint().notNull().default(0),
  isPublished: boolean().notNull().default(true),
  ...timestamps,
});

/** Answers are plain text: they also feed the `FAQPage` JSON-LD. */
export const faqItemTranslations = pgTable(
  "faq_item_translations",
  {
    faqItemId: uuid()
      .notNull()
      .references(() => faqItems.id, { onDelete: "cascade" }),
    locale: localeEnum().notNull(),
    question: varchar({ length: 200 }).notNull(),
    answer: text().notNull(),
  },
  (table) => [primaryKey({ columns: [table.faqItemId, table.locale] })],
);

export type FaqItemRow = typeof faqItems.$inferSelect;
