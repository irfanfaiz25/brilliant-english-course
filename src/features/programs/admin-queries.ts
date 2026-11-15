import "server-only";

import { asc, count, eq, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import {
  mediaAssets,
  programClasses,
  programClassTranslations,
  programLevels,
  programLevelTranslations,
  unitClasses,
  unitLevels,
} from "@/db/schema";
import { mediaUrl } from "@/features/media/service";
import type { SessionUser } from "@/features/users/schema";
import { routing, type Locale } from "@/i18n/routing";
import { toRows } from "@/lib/form-schemas";
import { assertCan } from "@/lib/permissions";
import { groupTranslations, pickTranslation } from "@/lib/translations";

import type { LevelClass, LevelFormInput, LevelTheme } from "./schema";

/*
 * Admin reads of program levels: every level (published or not) with both locales. Uncached and
 * permission-checked (data access layer, ADR-025).
 */

export type AdminLevelClass = Pick<LevelClass, "id" | "name" | "gradeFrom" | "gradeTo">;

export type AdminLevel = {
  id: string;
  slug: string;
  theme: LevelTheme;
  inAgeFinder: boolean;
  /** Units that offer the level; a level offered anywhere cannot be deleted. */
  unitCount: number;
  /** Its classes in teaching order. */
  classes: AdminLevelClass[];
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
  const [levels, translations, offers, classes] = await Promise.all([
    db
      .select({ level: programLevels, imageKey: mediaAssets.key })
      .from(programLevels)
      .leftJoin(mediaAssets, eq(mediaAssets.id, programLevels.imageId))
      .orderBy(asc(programLevels.sortOrder)),
    db.select().from(programLevelTranslations),
    db
      .select({ levelId: unitLevels.levelId, units: count() })
      .from(unitLevels)
      .groupBy(unitLevels.levelId),
    db.select().from(programClasses).orderBy(asc(programClasses.sortOrder)),
  ]);
  const byLevel = groupTranslations(translations, (row) => row.levelId);
  const unitCounts = new Map(offers.map((row) => [row.levelId, row.units]));
  const classesByLevel = new Map<string, AdminLevelClass[]>();
  for (const { id, levelId, name, gradeFrom, gradeTo } of classes) {
    const list = classesByLevel.get(levelId) ?? [];
    list.push({ id, name, gradeFrom, gradeTo });
    classesByLevel.set(levelId, list);
  }
  return levels.map(({ level, imageKey }) => {
    const text = pickTranslation(byLevel.get(level.id) ?? [], locale);
    return {
      id: level.id,
      slug: level.slug,
      theme: level.theme,
      inAgeFinder: level.inAgeFinder,
      unitCount: unitCounts.get(level.id) ?? 0,
      classes: classesByLevel.get(level.id) ?? [],
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
  id: string;
  /** Units that offer the level (it can be deleted only at 0). */
  unitCount: number;
  /** Classes a unit opened by name: they cannot be removed from the level. */
  classesInUse: string[];
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
  slug: string,
): Promise<LevelForEdit | null> {
  assertCan(actor, "read", "programs");
  const [row] = await db
    .select({ level: programLevels, imageKey: mediaAssets.key })
    .from(programLevels)
    .leftJoin(mediaAssets, eq(mediaAssets.id, programLevels.imageId))
    .where(eq(programLevels.slug, slug));
  if (!row) return null;
  const { level, imageKey } = row;
  const [translations, [offers], classes] = await Promise.all([
    db
      .select()
      .from(programLevelTranslations)
      .where(eq(programLevelTranslations.levelId, level.id)),
    db.select({ units: count() }).from(unitLevels).where(eq(unitLevels.levelId, level.id)),
    db
      .select()
      .from(programClasses)
      .where(eq(programClasses.levelId, level.id))
      .orderBy(asc(programClasses.sortOrder)),
  ]);
  const classIds = classes.map((item) => item.id);
  const [classTexts, opened] = classIds.length
    ? await Promise.all([
        db
          .select()
          .from(programClassTranslations)
          .where(inArray(programClassTranslations.classId, classIds)),
        db
          .selectDistinct({ classId: unitClasses.classId })
          .from(unitClasses)
          .where(inArray(unitClasses.classId, classIds)),
      ])
    : [[], []];
  const focusOf = (classId: string, locale: Locale) =>
    classTexts.find((row) => row.classId === classId && row.locale === locale)?.focus ?? "";

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
    id: level.id,
    unitCount: offers?.units ?? 0,
    classesInUse: opened.map((row) => row.classId),
    values: {
      theme: level.theme,
      inAgeFinder: level.inAgeFinder,
      ageMin: level.ageMin,
      ageMax: level.ageMax,
      sessionsPerWeek: level.sessionsPerWeek,
      maxStudentsPerClass: level.maxStudentsPerClass,
      imageId: level.imageId ?? "",
      isPublished: level.isPublished,
      texts: Object.fromEntries(
        routing.locales.map((locale) => [locale, textFor(locale)]),
      ) as LevelFormInput["texts"],
      classes: classes.map((item) => ({
        classId: item.id,
        name: item.name,
        gradeFrom: item.gradeFrom,
        gradeTo: item.gradeTo,
        focus: { id: focusOf(item.id, "id"), en: focusOf(item.id, "en") },
      })),
    },
    imageSrc: imageKey ? mediaUrl(imageKey) : null,
    updatedAt: level.updatedAt,
  };
}
