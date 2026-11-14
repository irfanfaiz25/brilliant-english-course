import "server-only";

import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";
import { db } from "@/db/client";
import { activities, activityTranslations, mediaAssets } from "@/db/schema";
import { toImageRef } from "@/features/media/service";
import type { Locale } from "@/i18n/routing";
import { groupTranslations, pickTranslation } from "@/lib/translations";

import type { Activity } from "./schema";

/** Published recurring activities in display order, resolved to `locale`. */
export async function getActivities(locale: Locale): Promise<Activity[]> {
  "use cache";
  cacheTag(cacheTags.activities);
  cacheLife("hours");

  const [rows, translations] = await Promise.all([
    db
      .select({ activity: activities, image: mediaAssets })
      .from(activities)
      .leftJoin(mediaAssets, eq(mediaAssets.id, activities.imageId))
      .where(eq(activities.isPublished, true))
      .orderBy(asc(activities.sortOrder)),
    db.select().from(activityTranslations),
  ]);
  const byActivity = groupTranslations(translations, (row) => row.activityId);

  return rows.flatMap(({ activity, image }) => {
    const text = pickTranslation(byActivity.get(activity.id) ?? [], locale);
    if (!text || !image) return [];
    return [
      {
        slug: activity.slug,
        name: text.name,
        summary: text.summary,
        audience: text.audience,
        image: toImageRef(image, text.imageAlt),
      },
    ];
  });
}
