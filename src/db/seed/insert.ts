/**
 * Inserts shared by the development seed (`seed.ts`) and the starter content (`starter.ts`), so
 * both write programs, activities, units and FAQ the same way. Each takes the open transaction.
 */
import type { Database } from "@/db/client";
import * as schema from "@/db/schema";
import { placeholderImages } from "@/config/placeholder-images";
import type { UnitSummary } from "@/features/units/schema";

import type { activityFixtures } from "./content/activities";
import type { faqFixtures } from "./content/faq";
import type { levelFixtures } from "./content/programs";
import { pairByKey } from "./plan";

export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
/** The media id of a placeholder photo, by its path. */
export type MediaIdOf = (src: string) => string;

/** The placeholder photos (`public/placeholders`) as media rows. */
export async function insertPlaceholderMedia(tx: Transaction): Promise<MediaIdOf> {
  const media = await tx
    .insert(schema.mediaAssets)
    .values(
      Object.values(placeholderImages).map((image) => ({
        key: image.src,
        name: image.src.replace(/^.*\/|\.[a-z0-9]+$/g, ""),
        mimeType: "image/webp",
        width: image.width,
        height: image.height,
      })),
    )
    .returning({ id: schema.mediaAssets.id, key: schema.mediaAssets.key });
  return (src) => {
    const found = media.find((row) => row.key === src);
    if (!found) throw new Error(`No media row for ${src}`);
    return found.id;
  };
}

export type ProgramIds = {
  /** Level id by slug. */
  levelIds: Map<string, string>;
  /** Class id by `<level slug>/<class name>`. */
  classIds: Map<string, string>;
};

/** Program levels with their translations and classes (ADR-040). */
export async function insertLevels(
  tx: Transaction,
  fixtures: typeof levelFixtures,
  mediaId: MediaIdOf,
): Promise<ProgramIds> {
  const levelIds = new Map<string, string>();
  const classIds = new Map<string, string>();
  for (const [index, { key, id, en }] of pairByKey(fixtures, (level) => level.slug).entries()) {
    const [row] = await tx
      .insert(schema.programLevels)
      .values({
        slug: key,
        theme: id.theme,
        inAgeFinder: id.inAgeFinder,
        ageMin: id.ageMin,
        ageMax: id.ageMax,
        sessionsPerWeek: id.sessionsPerWeek,
        maxStudentsPerClass: id.maxStudentsPerClass,
        imageId: mediaId(id.image.src),
        sortOrder: index,
      })
      .returning({ id: schema.programLevels.id });
    if (!row) throw new Error(`Level ${key} was not inserted`);
    levelIds.set(key, row.id);
    await tx.insert(schema.programLevelTranslations).values(
      (["id", "en"] as const).map((locale) => {
        const text = locale === "id" ? id : en;
        return {
          levelId: row.id,
          locale,
          name: text.name,
          tagline: text.tagline,
          summary: text.summary,
          skills: text.skills,
          description: text.description,
          curriculum: text.curriculum,
          imageAlt: text.image.alt,
        };
      }),
    );
    // Classes: one row per class, its focus line per locale (the ids are shared by both).
    for (const [sortOrder, item] of id.classes.entries()) {
      const english = en.classes.find((other) => other.id === item.id);
      await tx.insert(schema.programClasses).values({
        id: item.id,
        levelId: row.id,
        name: item.name,
        gradeFrom: item.gradeFrom,
        gradeTo: item.gradeTo,
        sortOrder,
      });
      await tx.insert(schema.programClassTranslations).values([
        { classId: item.id, locale: "id", focus: item.focus },
        { classId: item.id, locale: "en", focus: english?.focus ?? "" },
      ]);
      classIds.set(`${key}/${item.name}`, item.id);
    }
  }
  return { levelIds, classIds };
}

/** Activities with their translations and popup photos (ADR-042). */
export async function insertActivities(
  tx: Transaction,
  fixtures: typeof activityFixtures,
  mediaId: MediaIdOf,
): Promise<void> {
  for (const [index, { key, id, en }] of pairByKey(
    fixtures,
    (activity) => activity.slug,
  ).entries()) {
    const [row] = await tx
      .insert(schema.activities)
      .values({ slug: key, imageId: mediaId(id.image.src), sortOrder: index })
      .returning({ id: schema.activities.id });
    if (!row) throw new Error(`Activity ${key} was not inserted`);
    await tx.insert(schema.activityTranslations).values(
      [id, en].map((text, i) => ({
        activityId: row.id,
        locale: i === 0 ? ("id" as const) : ("en" as const),
        name: text.name,
        summary: text.summary,
        audience: text.audience,
        imageAlt: text.image.alt,
        description: text.description,
        highlights: text.highlights,
        skills: text.skills,
        schedule: text.schedule,
      })),
    );
    // Popup photos: the same photos in both locales, captions per locale.
    for (const [sortOrder, photo] of id.photos.entries()) {
      const [photoRow] = await tx
        .insert(schema.activityPhotos)
        .values({ activityId: row.id, mediaId: mediaId(photo.image.src), sortOrder })
        .returning({ id: schema.activityPhotos.id });
      if (!photoRow) throw new Error(`Photo of activity ${key} was not inserted`);
      await tx.insert(schema.activityPhotoTranslations).values([
        { photoId: photoRow.id, locale: "id", caption: photo.caption },
        { photoId: photoRow.id, locale: "en", caption: en.photos[sortOrder]?.caption ?? "" },
      ]);
    }
  }
}

export type UnitRecord = UnitSummary & {
  studentsCount: number;
  /** `YYYY-MM-DD`. */
  openedAt: string;
  /** Levels a unit opens only partly → the class names it opens there. */
  classNames?: Record<string, string[]>;
};

/** Active units with their levels and, where a level is opened partly, its classes. */
export async function insertUnits(
  tx: Transaction,
  units: readonly UnitRecord[],
  { levelIds, classIds }: ProgramIds,
): Promise<string[]> {
  const unitIds: string[] = [];
  for (const unit of units) {
    const [row] = await tx
      .insert(schema.units)
      .values({
        code: unit.code,
        slug: unit.slug,
        name: unit.name,
        status: "active",
        enrollment: unit.enrollment,
        villageCode: unit.villageCode,
        address: unit.address,
        latitude: unit.location.lat,
        longitude: unit.location.lng,
        managerName: unit.manager,
        whatsapp: unit.whatsapp,
        openDays: unit.openDays,
        opensAt: unit.opensAt,
        closesAt: unit.closesAt,
        studentsCount: unit.studentsCount,
        openedAt: unit.openedAt,
      })
      .returning({ id: schema.units.id });
    if (!row) throw new Error(`Unit ${unit.code} was not inserted`);
    unitIds.push(row.id);
    const someClasses = unit.classNames ?? {};
    await tx.insert(schema.unitLevels).values(
      unit.levels.map((slug) => {
        const levelId = levelIds.get(slug);
        if (!levelId) throw new Error(`Unknown level ${slug}`);
        return { unitId: row.id, levelId, allClasses: !someClasses[slug] };
      }),
    );
    const opened = Object.entries(someClasses).flatMap(([slug, names]) =>
      names.map((name) => {
        const classId = classIds.get(`${slug}/${name}`);
        if (!classId) throw new Error(`Unknown class ${slug}/${name}`);
        return { unitId: row.id, classId };
      }),
    );
    if (opened.length > 0) await tx.insert(schema.unitClasses).values(opened);
  }
  return unitIds;
}

/** FAQ items with their translations. */
export async function insertFaq(tx: Transaction, fixtures: typeof faqFixtures): Promise<void> {
  for (const [index, { id, en }] of pairByKey(fixtures, (item) => item.id).entries()) {
    const [row] = await tx
      .insert(schema.faqItems)
      .values({ topic: id.topic, sortOrder: index })
      .returning({ id: schema.faqItems.id });
    if (!row) throw new Error(`FAQ ${id.id} was not inserted`);
    await tx.insert(schema.faqItemTranslations).values([
      { faqItemId: row.id, locale: "id", question: id.question, answer: id.answer },
      { faqItemId: row.id, locale: "en", question: en.question, answer: en.answer },
    ]);
  }
}
