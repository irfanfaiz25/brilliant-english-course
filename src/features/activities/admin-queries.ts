import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { activities, activityTranslations, mediaAssets } from "@/db/schema";
import { mediaUrl } from "@/features/media/service";
import type { SessionUser } from "@/features/users/schema";
import type { Locale } from "@/i18n/routing";
import { assertCan } from "@/lib/permissions";
import { groupTranslations, pickTranslation } from "@/lib/translations";

import type { ActivityFormInput } from "./schema";

/*
 * Admin reads of activities: every activity, published or not, uncached and permission-checked
 * (data access layer, ADR-025).
 */

export type AdminActivity = {
  id: string;
  name: string;
  audience: string;
  isPublished: boolean;
  imageSrc: string | null;
  updatedAt: Date;
};

/** All activities in display order, named in `locale` (falling back to Indonesian). */
export async function getAdminActivities(
  actor: SessionUser,
  locale: Locale,
): Promise<AdminActivity[]> {
  assertCan(actor, "read", "activities");
  const [rows, translations] = await Promise.all([
    db
      .select({ activity: activities, imageKey: mediaAssets.key })
      .from(activities)
      .leftJoin(mediaAssets, eq(mediaAssets.id, activities.imageId))
      .orderBy(asc(activities.sortOrder), asc(activities.createdAt)),
    db.select().from(activityTranslations),
  ]);
  const byActivity = groupTranslations(translations, (row) => row.activityId);
  return rows.map(({ activity, imageKey }) => {
    const text = pickTranslation(byActivity.get(activity.id) ?? [], locale);
    return {
      id: activity.id,
      name: text?.name ?? activity.slug,
      audience: text?.audience ?? "",
      isPublished: activity.isPublished,
      imageSrc: imageKey ? mediaUrl(imageKey) : null,
      updatedAt: activity.updatedAt,
    };
  });
}

export type ActivityForEdit = {
  values: ActivityFormInput;
  imageSrc: string | null;
  updatedAt: Date;
};

/** One activity as form values, or `null` when it does not exist. */
export async function getActivityForEdit(
  actor: SessionUser,
  id: string,
): Promise<ActivityForEdit | null> {
  assertCan(actor, "read", "activities");
  const [row] = await db
    .select({ activity: activities, imageKey: mediaAssets.key })
    .from(activities)
    .leftJoin(mediaAssets, eq(mediaAssets.id, activities.imageId))
    .where(eq(activities.id, id));
  if (!row) return null;
  const translations = await db
    .select()
    .from(activityTranslations)
    .where(eq(activityTranslations.activityId, id));
  const textFor = (locale: Locale) => {
    const text = translations.find((translation) => translation.locale === locale);
    return {
      name: text?.name ?? "",
      summary: text?.summary ?? "",
      audience: text?.audience ?? "",
      imageAlt: text?.imageAlt ?? "",
    };
  };
  return {
    values: {
      imageId: row.activity.imageId ?? "",
      isPublished: row.activity.isPublished,
      texts: { id: textFor("id"), en: textFor("en") },
    },
    imageSrc: row.imageKey ? mediaUrl(row.imageKey) : null,
    updatedAt: row.activity.updatedAt,
  };
}
