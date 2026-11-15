import { and, eq, ne } from "drizzle-orm";

import { db } from "@/db/client";
import { programLevels, programLevelTranslations, unitLevels } from "@/db/schema";
import { routing } from "@/i18n/routing";
import { ActionFailure } from "@/lib/action-result";
import { writeAuditLog } from "@/lib/audit";
import { isSameList } from "@/lib/ordering";
import { slugify, uniqueSlug } from "@/lib/slug";

import type { Level, LevelForm } from "./schema";

/**
 * Slugs a new level may not take: admin routes beside `/admin/program/[slug]` and the ids other
 * sections of the Program page already use (a level section is `#<slug>`, its heading
 * `#<slug>-title`).
 */
export const reservedLevelSlugs: ReadonlySet<string> = new Set([
  "baru",
  "program",
  "kegiatan",
  "why",
  "compare",
  "faq",
  "closing-cta",
]);

/** The level in the age finder whose age range contains `age`, if any. */
export function findLevelForAge(levels: readonly Level[], age: number): string | undefined {
  return levels.find((level) => level.inAgeFinder && age >= level.ageMin && age <= level.ageMax)
    ?.slug;
}

type AgeRange = { ageMin: number; ageMax: number };

/**
 * Whether `range` shares an age with any of `others`. Levels in the age finder may not overlap,
 * so the hero age chips always point at exactly one level.
 */
export function overlapsAgeRange(range: AgeRange, others: readonly AgeRange[]): boolean {
  return others.some((other) => range.ageMin <= other.ageMax && other.ageMin <= range.ageMax);
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Refuses a finder range that collides with another finder level (`exceptId`: the level itself). */
async function assertFreeAgeRange(tx: Tx, form: LevelForm, exceptId?: string) {
  if (!form.inAgeFinder) return;
  const others = await tx
    .select({ ageMin: programLevels.ageMin, ageMax: programLevels.ageMax })
    .from(programLevels)
    .where(
      and(
        eq(programLevels.inAgeFinder, true),
        exceptId ? ne(programLevels.id, exceptId) : undefined,
      ),
    );
  if (overlapsAgeRange(form, others)) {
    throw new ActionFailure("invalid", { ageMin: "ageOverlap" });
  }
}

async function writeTexts(tx: Tx, levelId: string, texts: LevelForm["texts"]) {
  for (const locale of routing.locales) {
    const text = texts[locale];
    await tx
      .insert(programLevelTranslations)
      .values({ levelId, locale, ...text })
      .onConflictDoUpdate({
        target: [programLevelTranslations.levelId, programLevelTranslations.locale],
        set: text,
      });
  }
}

/** The columns of `program_levels` a form sets. */
const fieldsOf = (form: LevelForm) => ({
  theme: form.theme,
  inAgeFinder: form.inAgeFinder,
  ageMin: form.ageMin,
  ageMax: form.ageMax,
  sessionsPerWeek: form.sessionsPerWeek,
  maxStudentsPerClass: form.maxStudentsPerClass,
  imageId: form.imageId,
});

type SaveOptions = {
  actorId: string;
  /** Only roles with `publish` on programs show or hide a level; new ones stay hidden otherwise. */
  canPublish: boolean;
};

/**
 * Adds a level at the end of the list with its translations and an audit row. The slug comes
 * from the Indonesian name once and never changes (it is the level's anchor on the site).
 */
export async function createLevel(
  form: LevelForm,
  { actorId, canPublish }: SaveOptions,
): Promise<{ id: string; slug: string }> {
  return db.transaction(async (tx) => {
    await assertFreeAgeRange(tx, form);
    const existing = await tx
      .select({ slug: programLevels.slug, sortOrder: programLevels.sortOrder })
      .from(programLevels);
    const taken = new Set([...reservedLevelSlugs, ...existing.map((row) => row.slug)]);
    const slug = uniqueSlug(slugify(form.texts.id.name), taken, "program-baru");
    const sortOrder = Math.max(-1, ...existing.map((row) => row.sortOrder)) + 1;
    const fields = { ...fieldsOf(form), isPublished: canPublish && form.isPublished };
    const [level] = await tx
      .insert(programLevels)
      .values({ slug, sortOrder, ...fields })
      .returning({ id: programLevels.id, slug: programLevels.slug });
    if (!level) throw new Error("Program level insert returned no row");
    await writeTexts(tx, level.id, form.texts);
    await writeAuditLog(tx, {
      actorId,
      action: "program.create",
      entityType: "program_level",
      entityId: level.id,
      changes: { after: { slug, ...fields, texts: form.texts } },
    });
    return level;
  });
}

/**
 * Saves a level's numbers, theme, photo and copy in every locale with one audit row. Throws
 * `ActionFailure("notFound")` for an unknown level and an `ageOverlap` field error when its range
 * collides with another level in the age finder.
 */
export async function updateLevel(
  id: string,
  form: LevelForm,
  { actorId, canPublish }: SaveOptions,
) {
  await db.transaction(async (tx) => {
    const [level] = await tx
      .select()
      .from(programLevels)
      .where(eq(programLevels.id, id))
      .for("update");
    if (!level) throw new ActionFailure("notFound");
    await assertFreeAgeRange(tx, form, id);

    const before = await tx
      .select()
      .from(programLevelTranslations)
      .where(eq(programLevelTranslations.levelId, id));
    const fields = {
      ...fieldsOf(form),
      isPublished: canPublish ? form.isPublished : level.isPublished,
    };
    await tx
      .update(programLevels)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(programLevels.id, id));
    await writeTexts(tx, id, form.texts);

    await writeAuditLog(tx, {
      actorId,
      action: "program.update",
      entityType: "program_level",
      entityId: id,
      changes: {
        before: {
          theme: level.theme,
          inAgeFinder: level.inAgeFinder,
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

/**
 * Deletes a level no unit offers (translations cascade); the audit row keeps its names. A level a
 * unit still offers is refused with `levelInUse`: hide it instead, or take it off those units.
 */
export async function deleteLevel(id: string, actorId: string) {
  await db.transaction(async (tx) => {
    const [level] = await tx
      .select({ id: programLevels.id, slug: programLevels.slug })
      .from(programLevels)
      .where(eq(programLevels.id, id))
      .for("update");
    if (!level) throw new ActionFailure("notFound");
    const [offered] = await tx
      .select({ unitId: unitLevels.unitId })
      .from(unitLevels)
      .where(eq(unitLevels.levelId, id))
      .limit(1);
    if (offered) throw new ActionFailure("levelInUse");

    const names = await tx
      .select({ locale: programLevelTranslations.locale, name: programLevelTranslations.name })
      .from(programLevelTranslations)
      .where(eq(programLevelTranslations.levelId, id));
    await tx.delete(programLevels).where(eq(programLevels.id, id));
    await writeAuditLog(tx, {
      actorId,
      action: "program.delete",
      entityType: "program_level",
      entityId: id,
      changes: {
        before: {
          slug: level.slug,
          names: Object.fromEntries(names.map((row) => [row.locale, row.name])),
        },
      },
    });
  });
}

/** Shows or hides a level on the public site (Home, Program, hero age finder, unit cards). */
export async function setLevelPublished(id: string, isPublished: boolean, actorId: string) {
  await db.transaction(async (tx) => {
    const [level] = await tx
      .update(programLevels)
      .set({ isPublished, updatedAt: new Date() })
      .where(eq(programLevels.id, id))
      .returning({ id: programLevels.id });
    if (!level) throw new ActionFailure("notFound");
    await writeAuditLog(tx, {
      actorId,
      action: "program.publish",
      entityType: "program_level",
      entityId: id,
      changes: { isPublished },
    });
  });
}

/**
 * Saves the order of every level (`ids`, as dragged) and renumbers them 0, 1, 2, …. Refused when
 * the list changed since the page was loaded (a level added or deleted meanwhile).
 */
export async function reorderLevels(ids: string[], moved: string, actorId: string) {
  await db.transaction(async (tx) => {
    const rows = await tx
      .select({ id: programLevels.id, sortOrder: programLevels.sortOrder })
      .from(programLevels)
      .for("update");
    if (
      !isSameList(
        rows.map((row) => row.id),
        ids,
      )
    )
      throw new ActionFailure("orderChanged");
    const current = new Map(rows.map((row) => [row.id, row.sortOrder]));
    for (const [index, id] of ids.entries()) {
      if (current.get(id) === index) continue;
      await tx.update(programLevels).set({ sortOrder: index }).where(eq(programLevels.id, id));
    }
    await writeAuditLog(tx, {
      actorId,
      action: "program.reorder",
      entityType: "program_level",
      entityId: moved,
      changes: { position: ids.indexOf(moved), order: ids },
    });
  });
}
