import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";
import type { Locale } from "@/i18n/routing";

import { activityFixtures } from "./fixtures";
import type { Activity } from "./schema";

/** Recurring activities in display order. Reads fixtures until the database lands (Phase 3). */
export async function getActivities(locale: Locale): Promise<Activity[]> {
  "use cache";
  cacheTag(cacheTags.activities);
  cacheLife("hours");
  return activityFixtures[locale];
}
