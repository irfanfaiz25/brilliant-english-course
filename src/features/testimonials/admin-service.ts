import "server-only";

import { eq, max } from "drizzle-orm";

import type { Database } from "@/db/client";
import { db } from "@/db/client";
import { testimonials, testimonialTranslations } from "@/db/schema";
import { routing } from "@/i18n/routing";
import { ActionFailure } from "@/lib/action-result";
import { writeAuditLog } from "@/lib/audit";
import { isSameList } from "@/lib/ordering";

import type { TestimonialAudience, TestimonialForm } from "./schema";

/*
 * Admin writes of testimonials (Phase 4f). Each audience (parents on Beranda, partners on
 * Kemitraan) has its own order; every change commits with its audit row.
 */

type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

type SaveOptions = {
  actorId: string;
  /** Only roles with `publish` on testimonials decide visibility; otherwise new ones stay hidden. */
  canPublish: boolean;
};

/** The next free position at the end of an audience's list. */
async function nextSortOrder(tx: Tx, audience: TestimonialAudience) {
  const [row] = await tx
    .select({ last: max(testimonials.sortOrder) })
    .from(testimonials)
    .where(eq(testimonials.audience, audience));
  return (row?.last ?? -1) + 1;
}

async function writeTexts(tx: Tx, testimonialId: string, texts: TestimonialForm["texts"]) {
  for (const locale of routing.locales) {
    const text = texts[locale];
    await tx
      .insert(testimonialTranslations)
      .values({ testimonialId, locale, ...text })
      .onConflictDoUpdate({
        target: [testimonialTranslations.testimonialId, testimonialTranslations.locale],
        set: text,
      });
  }
}

const sharedFields = (form: TestimonialForm) => ({
  audience: form.audience,
  authorName: form.authorName,
  rating: form.rating,
});

/** Adds a testimonial at the end of its audience's list, with its translations and an audit row. */
export async function createTestimonial(
  form: TestimonialForm,
  { actorId, canPublish }: SaveOptions,
): Promise<{ id: string }> {
  return db.transaction(async (tx) => {
    const isPublished = canPublish && form.isPublished;
    const [created] = await tx
      .insert(testimonials)
      .values({
        ...sharedFields(form),
        sortOrder: await nextSortOrder(tx, form.audience),
        isPublished,
      })
      .returning({ id: testimonials.id });
    if (!created) throw new Error("Testimonial insert returned no row");
    await writeTexts(tx, created.id, form.texts);
    await writeAuditLog(tx, {
      actorId,
      action: "testimonial.create",
      entityType: "testimonial",
      entityId: created.id,
      changes: { after: { ...sharedFields(form), isPublished, texts: form.texts } },
    });
    return created;
  });
}

/**
 * Saves a testimonial with an audit row. Moving it to the other audience puts it at the end of
 * that list; publishers alone change its visibility.
 */
export async function updateTestimonial(
  id: string,
  form: TestimonialForm,
  { actorId, canPublish }: SaveOptions,
) {
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(testimonials)
      .where(eq(testimonials.id, id))
      .for("update");
    if (!current) throw new ActionFailure("notFound");
    const before = await tx
      .select()
      .from(testimonialTranslations)
      .where(eq(testimonialTranslations.testimonialId, id));
    const isPublished = canPublish ? form.isPublished : current.isPublished;
    const sortOrder =
      form.audience === current.audience
        ? current.sortOrder
        : await nextSortOrder(tx, form.audience);
    await tx
      .update(testimonials)
      .set({ ...sharedFields(form), sortOrder, isPublished, updatedAt: new Date() })
      .where(eq(testimonials.id, id));
    await writeTexts(tx, id, form.texts);
    await writeAuditLog(tx, {
      actorId,
      action: "testimonial.update",
      entityType: "testimonial",
      entityId: id,
      changes: {
        before: {
          audience: current.audience,
          authorName: current.authorName,
          rating: current.rating,
          isPublished: current.isPublished,
          texts: Object.fromEntries(
            before.map(({ locale, testimonialId: _, ...text }) => [locale, text]),
          ),
        },
        after: { ...sharedFields(form), isPublished, texts: form.texts },
      },
    });
  });
}

/** Deletes a testimonial (translations cascade); the audit row keeps who said it. */
export async function deleteTestimonial(id: string, actorId: string) {
  await db.transaction(async (tx) => {
    const [deleted] = await tx
      .delete(testimonials)
      .where(eq(testimonials.id, id))
      .returning({ audience: testimonials.audience, authorName: testimonials.authorName });
    if (!deleted) throw new ActionFailure("notFound");
    await writeAuditLog(tx, {
      actorId,
      action: "testimonial.delete",
      entityType: "testimonial",
      entityId: id,
      changes: { before: deleted },
    });
  });
}

/** Shows or hides a testimonial on the site. */
export async function setTestimonialPublished(id: string, isPublished: boolean, actorId: string) {
  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(testimonials)
      .set({ isPublished, updatedAt: new Date() })
      .where(eq(testimonials.id, id))
      .returning({ id: testimonials.id });
    if (!updated) throw new ActionFailure("notFound");
    await writeAuditLog(tx, {
      actorId,
      action: "testimonial.publish",
      entityType: "testimonial",
      entityId: id,
      changes: { isPublished },
    });
  });
}

/**
 * Saves the order of one audience's testimonials (`ids`, as dragged) and renumbers them 0, 1, 2,
 * …. Refused when that list changed since the page was loaded.
 */
export async function reorderTestimonials(ids: string[], moved: string, actorId: string) {
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select({ audience: testimonials.audience })
      .from(testimonials)
      .where(eq(testimonials.id, moved));
    if (!row) throw new ActionFailure("orderChanged");
    const rows = await tx
      .select({ id: testimonials.id, sortOrder: testimonials.sortOrder })
      .from(testimonials)
      .where(eq(testimonials.audience, row.audience))
      .for("update");
    if (
      !isSameList(
        rows.map((item) => item.id),
        ids,
      )
    )
      throw new ActionFailure("orderChanged");
    const current = new Map(rows.map((item) => [item.id, item.sortOrder]));
    for (const [index, id] of ids.entries()) {
      if (current.get(id) === index) continue;
      await tx.update(testimonials).set({ sortOrder: index }).where(eq(testimonials.id, id));
    }
    await writeAuditLog(tx, {
      actorId,
      action: "testimonial.reorder",
      entityType: "testimonial",
      entityId: moved,
      changes: { audience: row.audience, position: ids.indexOf(moved), order: ids },
    });
  });
}
