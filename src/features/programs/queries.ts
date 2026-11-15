import "server-only";

import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";
import { db } from "@/db/client";
import {
  mediaAssets,
  programClasses,
  programClassTranslations,
  programLevels,
  programLevelTranslations,
} from "@/db/schema";
import { toImageRef } from "@/features/media/service";
import type { Locale } from "@/i18n/routing";
import { groupTranslations, pickTranslation } from "@/lib/translations";

import type { Level, LevelClass } from "./schema";

/** Published program levels in display order with their classes, resolved to `locale`. */
export async function getLevels(locale: Locale): Promise<Level[]> {
  "use cache";
  cacheTag(cacheTags.programs);
  cacheLife("hours");

  const [levels, translations, classes, classTexts] = await Promise.all([
    db
      .select({ level: programLevels, image: mediaAssets })
      .from(programLevels)
      .leftJoin(mediaAssets, eq(mediaAssets.id, programLevels.imageId))
      .where(eq(programLevels.isPublished, true))
      .orderBy(asc(programLevels.sortOrder)),
    db.select().from(programLevelTranslations),
    db.select().from(programClasses).orderBy(asc(programClasses.sortOrder)),
    db.select().from(programClassTranslations),
  ]);
  const byLevel = groupTranslations(translations, (row) => row.levelId);
  const classTextsByClass = groupTranslations(classTexts, (row) => row.classId);
  const classesByLevel = new Map<string, LevelClass[]>();
  for (const item of classes) {
    const list = classesByLevel.get(item.levelId) ?? [];
    list.push({
      id: item.id,
      name: item.name,
      gradeFrom: item.gradeFrom,
      gradeTo: item.gradeTo,
      focus: pickTranslation(classTextsByClass.get(item.id) ?? [], locale)?.focus ?? "",
    });
    classesByLevel.set(item.levelId, list);
  }

  return levels.flatMap(({ level, image }) => {
    const text = pickTranslation(byLevel.get(level.id) ?? [], locale);
    // A level without copy or photo is not ready to show; admin validation prevents it later.
    if (!text || !image) return [];
    return [
      {
        slug: level.slug,
        theme: level.theme,
        inAgeFinder: level.inAgeFinder,
        name: text.name,
        ageMin: level.ageMin,
        ageMax: level.ageMax,
        tagline: text.tagline,
        summary: text.summary,
        skills: text.skills,
        description: text.description,
        curriculum: text.curriculum,
        sessionsPerWeek: level.sessionsPerWeek,
        maxStudentsPerClass: level.maxStudentsPerClass,
        image: toImageRef(image, text.imageAlt),
        classes: classesByLevel.get(level.id) ?? [],
      },
    ];
  });
}
