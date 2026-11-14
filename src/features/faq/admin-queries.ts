import "server-only";

import { asc, count, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { faqItems, faqItemTranslations } from "@/db/schema";
import type { SessionUser } from "@/features/users/schema";
import type { Locale } from "@/i18n/routing";
import { assertCan } from "@/lib/permissions";
import { groupTranslations, pickTranslation } from "@/lib/translations";

import { faqTopics, type FaqFormInput, type FaqTopic } from "./schema";

/*
 * Admin reads of FAQ entries: published or not, uncached and permission-checked (data access
 * layer, ADR-025).
 */

export type AdminFaqItem = {
  id: string;
  question: string;
  answer: string;
  isPublished: boolean;
};

export type AdminFaqList = {
  items: AdminFaqItem[];
  /** Entries per topic, for the filter chips. */
  counts: Record<FaqTopic, number>;
};

/** One topic's entries in display order, worded in `locale` (falling back to Indonesian). */
export async function getAdminFaqItems(
  actor: SessionUser,
  locale: Locale,
  topic: FaqTopic,
): Promise<AdminFaqList> {
  assertCan(actor, "read", "faq");
  const [rows, totals] = await Promise.all([
    db
      .select()
      .from(faqItems)
      .where(eq(faqItems.topic, topic))
      .orderBy(asc(faqItems.sortOrder), asc(faqItems.createdAt)),
    db.select({ topic: faqItems.topic, total: count() }).from(faqItems).groupBy(faqItems.topic),
  ]);
  const translations = rows.length ? await db.select().from(faqItemTranslations) : [];
  const byItem = groupTranslations(translations, (row) => row.faqItemId);
  const counts = Object.fromEntries(
    faqTopics.map((key) => [key, totals.find((row) => row.topic === key)?.total ?? 0]),
  ) as Record<FaqTopic, number>;

  return {
    counts,
    items: rows.map((row) => {
      const text = pickTranslation(byItem.get(row.id) ?? [], locale);
      return {
        id: row.id,
        question: text?.question ?? "",
        answer: text?.answer ?? "",
        isPublished: row.isPublished,
      };
    }),
  };
}

export type FaqItemForEdit = { values: FaqFormInput; updatedAt: Date };

/** One entry as form values, or `null` when it does not exist. */
export async function getFaqItemForEdit(
  actor: SessionUser,
  id: string,
): Promise<FaqItemForEdit | null> {
  assertCan(actor, "read", "faq");
  const [row] = await db.select().from(faqItems).where(eq(faqItems.id, id));
  if (!row) return null;
  const translations = await db
    .select()
    .from(faqItemTranslations)
    .where(eq(faqItemTranslations.faqItemId, id));
  const textFor = (locale: Locale) => {
    const text = translations.find((translation) => translation.locale === locale);
    return { question: text?.question ?? "", answer: text?.answer ?? "" };
  };
  return {
    values: {
      topic: row.topic,
      isPublished: row.isPublished,
      texts: { id: textFor("id"), en: textFor("en") },
    },
    updatedAt: row.updatedAt,
  };
}
