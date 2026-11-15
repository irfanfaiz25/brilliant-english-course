import "server-only";

import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";
import { db } from "@/db/client";
import {
  activities,
  activityPhotos,
  activityPhotoTranslations,
  activityTranslations,
  mediaAssets,
} from "@/db/schema";
import { toImageRef } from "@/features/media/service";
import type { Locale } from "@/i18n/routing";
import { groupTranslations, pickTranslation } from "@/lib/translations";

import type { Activity } from "./schema";

/**
 * Published recurring activities in display order, resolved to `locale`, with the details and
 * photos of their popup (ADR-042).
 */
export async function getActivities(locale: Locale): Promise<Activity[]> {
  "use cache";
  cacheTag(cacheTags.activities);
  cacheLife("hours");

  const [rows, translations, photos, photoTexts] = await Promise.all([
    db
      .select({ activity: activities, image: mediaAssets })
      .from(activities)
      .leftJoin(mediaAssets, eq(mediaAssets.id, activities.imageId))
      .where(eq(activities.isPublished, true))
      .orderBy(asc(activities.sortOrder)),
    db.select().from(activityTranslations),
    db
      .select({ photo: activityPhotos, image: mediaAssets })
      .from(activityPhotos)
      .innerJoin(mediaAssets, eq(mediaAssets.id, activityPhotos.mediaId))
      .orderBy(asc(activityPhotos.sortOrder)),
    db.select().from(activityPhotoTranslations),
  ]);
  const byActivity = groupTranslations(translations, (row) => row.activityId);
  const captions = groupTranslations(photoTexts, (row) => row.photoId);
  const photosOf = (activityId: string, name: string) =>
    photos
      .filter(({ photo }) => photo.activityId === activityId)
      .map(({ photo, image }) => {
        const caption = pickTranslation(captions.get(photo.id) ?? [], locale)?.caption ?? "";
        return { image: toImageRef(image, caption || name), caption };
      });

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
        description: text.description,
        highlights: text.highlights,
        skills: text.skills,
        schedule: text.schedule,
        photos: photosOf(activity.id, text.name),
      },
    ];
  });
}
