import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { mediaAssets, programLevels, programLevelTranslations } from "@/db/schema";
import { mediaUrl } from "@/features/media/service";
import type { SessionUser } from "@/features/users/schema";
import { routing, type Locale } from "@/i18n/routing";
import { toRows } from "@/lib/form-schemas";
import { assertCan } from "@/lib/permissions";
import { groupTranslations, pickTranslation } from "@/lib/translations";

import type { LevelFormInput, LevelSlug } from "./schema";

/*
 * Admin reads of program levels: every level (published or not) with both locales. Uncached and
 * permission-checked (data access layer, ADR-025).
 */

export type AdminLevel = {
  slug: LevelSlug;
  name: string;
  tagline: string;
  ageMin: number;
  ageMax: number;
  sessionsPerWeek: number;
  maxStudentsPerClass: number;
  isPublished: boolean;
  imageSrc: string | null;
  updatedAt: Date;
};

/** All levels in display order, named in the admin locale. */
export async function getAdminLevels(actor: SessionUser, locale: Locale): Promise<AdminLevel[]> {
  assertCan(actor, "read", "programs");
  const [levels, translations] = await Promise.all([
    db
      .select({ level: programLevels, imageKey: mediaAssets.key })
      .from(programLevels)
      .leftJoin(mediaAssets, eq(mediaAssets.id, programLevels.imageId))
      .orderBy(asc(programLevels.sortOrder)),
    db.select().from(programLevelTranslations),
  ]);
  const byLevel = groupTranslations(translations, (row) => row.levelId);
  return levels.map(({ level, imageKey }) => {
    const text = pickTranslation(byLevel.get(level.id) ?? [], locale);
    return {
      slug: level.slug as LevelSlug,
      name: text?.name ?? level.slug,
      tagline: text?.tagline ?? "",
      ageMin: level.ageMin,
      ageMax: level.ageMax,
      sessionsPerWeek: level.sessionsPerWeek,
      maxStudentsPerClass: level.maxStudentsPerClass,
      isPublished: level.isPublished,
      imageSrc: imageKey ? mediaUrl(imageKey) : null,
      updatedAt: level.updatedAt,
    };
  });
}

export type LevelForEdit = {
  values: LevelFormInput;
  imageSrc: string | null;
  updatedAt: Date;
};

const emptyText = {
  name: "",
  tagline: "",
  summary: "",
  skills: [],
  description: "",
  curriculum: [],
  imageAlt: "",
} as const;

/** One level as form values (lists as rows), or `null` for an unknown slug. */
export async function getLevelForEdit(
  actor: SessionUser,
  slug: LevelSlug,
): Promise<LevelForEdit | null> {
  assertCan(actor, "read", "programs");
  const [row] = await db
    .select({ level: programLevels, imageKey: mediaAssets.key })
    .from(programLevels)
    .leftJoin(mediaAssets, eq(mediaAssets.id, programLevels.imageId))
    .where(eq(programLevels.slug, slug));
  if (!row) return null;
  const { level, imageKey } = row;
  const translations = await db
    .select()
    .from(programLevelTranslations)
    .where(eq(programLevelTranslations.levelId, level.id));

  const textFor = (locale: Locale) => {
    const text = translations.find((translation) => translation.locale === locale) ?? emptyText;
    return {
      name: text.name,
      tagline: text.tagline,
      summary: text.summary,
      skills: toRows(text.skills),
      description: text.description,
      curriculum: toRows(text.curriculum),
      imageAlt: text.imageAlt,
    };
  };

  return {
    values: {
      slug,
      ageMin: level.ageMin,
      ageMax: level.ageMax,
      sessionsPerWeek: level.sessionsPerWeek,
      maxStudentsPerClass: level.maxStudentsPerClass,
      imageId: level.imageId ?? "",
      isPublished: level.isPublished,
      texts: Object.fromEntries(
        routing.locales.map((locale) => [locale, textFor(locale)]),
      ) as LevelFormInput["texts"],
    },
    imageSrc: imageKey ? mediaUrl(imageKey) : null,
    updatedAt: level.updatedAt,
  };
}
