import { asc, eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { activities, activityTranslations } from "@/db/schema";
import { routing } from "@/i18n/routing";
import { ActionFailure } from "@/lib/action-result";
import { writeAuditLog } from "@/lib/audit";
import { moveInOrder, type MoveDirection } from "@/lib/ordering";
import { slugify } from "@/lib/slug";

import type { ActivityForm } from "./schema";

/** `base`, or `base-2`, `base-3`, … whichever is not taken yet. */
export function uniqueSlug(base: string, taken: ReadonlySet<string>): string {
  const root = base || "kegiatan";
  if (!taken.has(root)) return root;
  for (let suffix = 2; ; suffix += 1) {
    const candidate = `${root}-${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function writeTexts(tx: Tx, activityId: string, texts: ActivityForm["texts"]) {
  for (const locale of routing.locales) {
    const text = texts[locale];
    await tx
      .insert(activityTranslations)
      .values({ activityId, locale, ...text })
      .onConflictDoUpdate({
        target: [activityTranslations.activityId, activityTranslations.locale],
        set: text,
      });
  }
}

type SaveOptions = {
  actorId: string;
  /** Only roles with `publish` on activities decide visibility; otherwise new ones stay hidden. */
  canPublish: boolean;
};

/** Creates an activity at the end of the list with its translations and an audit row. */
export async function createActivity(
  form: ActivityForm,
  { actorId, canPublish }: SaveOptions,
): Promise<{ id: string }> {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select({ slug: activities.slug, sortOrder: activities.sortOrder })
      .from(activities);
    const slug = uniqueSlug(slugify(form.texts.id.name), new Set(existing.map((row) => row.slug)));
    const sortOrder = Math.max(-1, ...existing.map((row) => row.sortOrder)) + 1;
    const [activity] = await tx
      .insert(activities)
      .values({
        slug,
        imageId: form.imageId,
        sortOrder,
        isPublished: canPublish && form.isPublished,
      })
      .returning({ id: activities.id });
    if (!activity) throw new Error("Activity insert returned no row");
    await writeTexts(tx, activity.id, form.texts);
    await writeAuditLog(tx, {
      actorId,
      action: "activity.create",
      entityType: "activity",
      entityId: activity.id,
      changes: { after: { slug, imageId: form.imageId, texts: form.texts } },
    });
    return activity;
  });
}

/** Saves an activity's photo, copy and (for publishers) visibility with an audit row. */
export async function updateActivity(
  id: string,
  form: ActivityForm,
  { actorId, canPublish }: SaveOptions,
) {
  await db.transaction(async (tx) => {
    const [activity] = await tx
      .select()
      .from(activities)
      .where(eq(activities.id, id))
      .for("update");
    if (!activity) throw new ActionFailure("notFound");
    const before = await tx
      .select()
      .from(activityTranslations)
      .where(eq(activityTranslations.activityId, id));
    const isPublished = canPublish ? form.isPublished : activity.isPublished;
    await tx
      .update(activities)
      .set({ imageId: form.imageId, isPublished, updatedAt: new Date() })
      .where(eq(activities.id, id));
    await writeTexts(tx, id, form.texts);
    await writeAuditLog(tx, {
      actorId,
      action: "activity.update",
      entityType: "activity",
      entityId: id,
      changes: {
        before: {
          imageId: activity.imageId,
          isPublished: activity.isPublished,
          texts: Object.fromEntries(
            before.map(({ locale, activityId: _, ...text }) => [locale, text]),
          ),
        },
        after: { imageId: form.imageId, isPublished, texts: form.texts },
      },
    });
  });
}

/** Deletes an activity (translations cascade); the audit row keeps its names. */
export async function deleteActivity(id: string, actorId: string) {
  await db.transaction(async (tx) => {
    const names = await tx
      .select({ locale: activityTranslations.locale, name: activityTranslations.name })
      .from(activityTranslations)
      .where(eq(activityTranslations.activityId, id));
    const [deleted] = await tx
      .delete(activities)
      .where(eq(activities.id, id))
      .returning({ slug: activities.slug });
    if (!deleted) throw new ActionFailure("notFound");
    await writeAuditLog(tx, {
      actorId,
      action: "activity.delete",
      entityType: "activity",
      entityId: id,
      changes: {
        before: {
          slug: deleted.slug,
          names: Object.fromEntries(names.map((row) => [row.locale, row.name])),
        },
      },
    });
  });
}

/** Shows or hides an activity on Home and Program. */
export async function setActivityPublished(id: string, isPublished: boolean, actorId: string) {
  await db.transaction(async (tx) => {
    const [activity] = await tx
      .update(activities)
      .set({ isPublished, updatedAt: new Date() })
      .where(eq(activities.id, id))
      .returning({ id: activities.id });
    if (!activity) throw new ActionFailure("notFound");
    await writeAuditLog(tx, {
      actorId,
      action: "activity.publish",
      entityType: "activity",
      entityId: id,
      changes: { isPublished },
    });
  });
}

/** Moves an activity one place up or down and renumbers the list (0, 1, 2, …). */
export async function moveActivity(id: string, direction: MoveDirection, actorId: string) {
  await db.transaction(async (tx) => {
    const rows = await tx
      .select({ id: activities.id })
      .from(activities)
      .orderBy(asc(activities.sortOrder), asc(activities.createdAt))
      .for("update");
    const ids = rows.map((row) => row.id);
    if (!ids.includes(id)) throw new ActionFailure("notFound");
    const order = moveInOrder(ids, id, direction);
    for (const [index, rowId] of order.entries()) {
      await tx
        .update(activities)
        .set({ sortOrder: index })
        .where(sql`${activities.id} = ${rowId} and ${activities.sortOrder} <> ${index}`);
    }
    await writeAuditLog(tx, {
      actorId,
      action: "activity.reorder",
      entityType: "activity",
      entityId: id,
      changes: { direction, position: order.indexOf(id) },
    });
  });
}
