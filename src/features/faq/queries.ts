import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";
import { db } from "@/db/client";
import { faqItems, faqItemTranslations } from "@/db/schema";
import type { Locale } from "@/i18n/routing";
import { groupTranslations, pickTranslation } from "@/lib/translations";

import type { FaqItem } from "./schema";

/** Published FAQ entries for a topic, in display order, resolved to `locale`. */
export async function getFaqItems(locale: Locale, topic: FaqItem["topic"]): Promise<FaqItem[]> {
  "use cache";
  cacheTag(cacheTags.faq);
  cacheLife("hours");

  const rows = await db
    .select()
    .from(faqItems)
    .where(and(eq(faqItems.isPublished, true), eq(faqItems.topic, topic)))
    .orderBy(asc(faqItems.sortOrder));
  const translations = rows.length ? await db.select().from(faqItemTranslations) : [];
  const byItem = groupTranslations(translations, (row) => row.faqItemId);

  return rows.flatMap((row) => {
    const text = pickTranslation(byItem.get(row.id) ?? [], locale);
    if (!text) return [];
    return [{ id: row.id, topic: row.topic, question: text.question, answer: text.answer }];
  });
}
