import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";
import type { Locale } from "@/i18n/routing";

import { faqFixtures } from "./fixtures";
import type { FaqItem } from "./schema";

/** FAQ entries for a topic, in display order. Reads fixtures until the database lands (Phase 3). */
export async function getFaqItems(locale: Locale, topic: FaqItem["topic"]): Promise<FaqItem[]> {
  "use cache";
  cacheTag(cacheTags.faq);
  cacheLife("hours");
  return faqFixtures[locale].filter((item) => item.topic === topic);
}
