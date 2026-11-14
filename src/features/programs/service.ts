import { eq, ne } from "drizzle-orm";

import { db } from "@/db/client";
import { programLevels, programLevelTranslations } from "@/db/schema";
import { routing } from "@/i18n/routing";
import { ActionFailure } from "@/lib/action-result";
import { writeAuditLog } from "@/lib/audit";

import type { Level, LevelForm, LevelSlug, LevelText } from "./schema";

/** The level whose age range contains `age`, if any. */
export function findLevelForAge(levels: readonly Level[], age: number): LevelSlug | undefined {
  return levels.find((level) => age >= level.ageMin && age <= level.ageMax)?.slug;
}

type AgeRange = { ageMin: number; ageMax: number };

/**
 * Whether `range` shares an age with any of `others`. Overlaps would make the age finder on the
 * home page ambiguous, so a level's range must not touch another level's.
 */
export function overlapsAgeRange(range: AgeRange, others: readonly AgeRange[]): boolean {
  return others.some((other) => range.ageMin <= other.ageMax && other.ageMin <= range.ageMax);
}

type SaveOptions = {
  actorId: string;
  /** Only roles with `publish` on programs may show or hide a level (`isPublished` is kept otherwise). */
  canPublish: boolean;
};

/**
 * Saves a level's numbers, photo and copy in every locale with one audit row, in a transaction.
 * Throws `ActionFailure("notFound")` for an unknown level and an `ageOverlap` field error when
 * the range collides with another level.
 */
export async function updateLevel(form: LevelForm, { actorId, canPublish }: SaveOptions) {
  await db.transaction(async (tx) => {
    const [level] = await tx
      .select()
      .from(programLevels)
      .where(eq(programLevels.slug, form.slug))
      .for("update");
    if (!level) throw new ActionFailure("notFound");

    const others = await tx
      .select({ ageMin: programLevels.ageMin, ageMax: programLevels.ageMax })
      .from(programLevels)
      .where(ne(programLevels.id, level.id));
    if (overlapsAgeRange(form, others)) {
      throw new ActionFailure("invalid", { ageMin: "ageOverlap" });
    }

    const before = await tx
      .select()
      .from(programLevelTranslations)
      .where(eq(programLevelTranslations.levelId, level.id));
    const isPublished = canPublish ? form.isPublished : level.isPublished;
    const fields = {
      ageMin: form.ageMin,
      ageMax: form.ageMax,
      sessionsPerWeek: form.sessionsPerWeek,
      maxStudentsPerClass: form.maxStudentsPerClass,
      imageId: form.imageId,
      isPublished,
    };
    await tx
      .update(programLevels)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(programLevels.id, level.id));
    for (const locale of routing.locales) {
      const text: LevelText = form.texts[locale];
      await tx
        .insert(programLevelTranslations)
        .values({ levelId: level.id, locale, ...text })
        .onConflictDoUpdate({
          target: [programLevelTranslations.levelId, programLevelTranslations.locale],
          set: text,
        });
    }

    await writeAuditLog(tx, {
      actorId,
      action: "program.update",
      entityType: "program_level",
      entityId: level.id,
      changes: {
        before: {
          ageMin: level.ageMin,
          ageMax: level.ageMax,
          sessionsPerWeek: level.sessionsPerWeek,
          maxStudentsPerClass: level.maxStudentsPerClass,
          imageId: level.imageId,
          isPublished: level.isPublished,
          texts: Object.fromEntries(
            before.map(({ locale, levelId: _, ...text }) => [locale, text]),
          ),
        },
        after: { ...fields, texts: form.texts },
      },
    });
  });
}

/** Shows or hides a level on the public site (Home, Program, hero age finder). */
export async function setLevelPublished(slug: LevelSlug, isPublished: boolean, actorId: string) {
  await db.transaction(async (tx) => {
    const [level] = await tx
      .update(programLevels)
      .set({ isPublished, updatedAt: new Date() })
      .where(eq(programLevels.slug, slug))
      .returning({ id: programLevels.id });
    if (!level) throw new ActionFailure("notFound");
    await writeAuditLog(tx, {
      actorId,
      action: "program.publish",
      entityType: "program_level",
      entityId: level.id,
      changes: { isPublished },
    });
  });
}
