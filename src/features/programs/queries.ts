import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";
import type { Locale } from "@/i18n/routing";

import { levelFixtures } from "./fixtures";
import type { Level } from "./schema";

/** Program levels in display order. Reads fixtures until the database lands (Phase 3). */
export async function getLevels(locale: Locale): Promise<Level[]> {
  "use cache";
  cacheTag(cacheTags.programs);
  cacheLife("hours");
  return levelFixtures[locale];
}
