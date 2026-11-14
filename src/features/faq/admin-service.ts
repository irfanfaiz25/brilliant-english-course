import "server-only";

import { eq, max } from "drizzle-orm";

import type { Database } from "@/db/client";
import { db } from "@/db/client";
import { faqItems, faqItemTranslations } from "@/db/schema";
import { routing } from "@/i18n/routing";
import { ActionFailure } from "@/lib/action-result";
import { writeAuditLog } from "@/lib/audit";
import { isSameList } from "@/lib/ordering";

import type { FaqForm, FaqTopic } from "./schema";

/*
 * Admin writes of FAQ entries (Phase 4f). Each topic (parents on Beranda, program on Program,
 * partners on Kemitraan) has its own order; every change commits with its audit row.
 */

type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

type SaveOptions = {
  actorId: string;
  /** Only roles with `publish` on FAQ decide visibility; otherwise new entries stay hidden. */
  canPublish: boolean;
};

/** The next free position at the end of a topic's list. */
async function nextSortOrder(tx: Tx, topic: FaqTopic) {
  const [row] = await tx
    .select({ last: max(faqItems.sortOrder) })
    .from(faqItems)
    .where(eq(faqItems.topic, topic));
  return (row?.last ?? -1) + 1;
}

async function writeTexts(tx: Tx, faqItemId: string, texts: FaqForm["texts"]) {
  for (const locale of routing.locales) {
    const text = texts[locale];
    await tx
      .insert(faqItemTranslations)
      .values({ faqItemId, locale, ...text })
      .onConflictDoUpdate({
        target: [faqItemTranslations.faqItemId, faqItemTranslations.locale],
        set: text,
      });
  }
}

/** Adds an entry at the end of its topic's list, with its translations and an audit row. */
export async function createFaqItem(
  form: FaqForm,
  { actorId, canPublish }: SaveOptions,
): Promise<{ id: string }> {
  return db.transaction(async (tx) => {
    const isPublished = canPublish && form.isPublished;
    const [created] = await tx
      .insert(faqItems)
      .values({ topic: form.topic, sortOrder: await nextSortOrder(tx, form.topic), isPublished })
      .returning({ id: faqItems.id });
    if (!created) throw new Error("FAQ insert returned no row");
    await writeTexts(tx, created.id, form.texts);
    await writeAuditLog(tx, {
      actorId,
      action: "faq.create",
      entityType: "faq_item",
      entityId: created.id,
      changes: { after: { topic: form.topic, isPublished, texts: form.texts } },
    });
    return created;
  });
}

/**
 * Saves an entry with an audit row. Moving it to another topic puts it at the end of that list;
 * publishers alone change its visibility.
 */
export async function updateFaqItem(
  id: string,
  form: FaqForm,
  { actorId, canPublish }: SaveOptions,
) {
  await db.transaction(async (tx) => {
    const [current] = await tx.select().from(faqItems).where(eq(faqItems.id, id)).for("update");
    if (!current) throw new ActionFailure("notFound");
    const before = await tx
      .select()
      .from(faqItemTranslations)
      .where(eq(faqItemTranslations.faqItemId, id));
    const isPublished = canPublish ? form.isPublished : current.isPublished;
    const sortOrder =
      form.topic === current.topic ? current.sortOrder : await nextSortOrder(tx, form.topic);
    await tx
      .update(faqItems)
      .set({ topic: form.topic, sortOrder, isPublished, updatedAt: new Date() })
      .where(eq(faqItems.id, id));
    await writeTexts(tx, id, form.texts);
    await writeAuditLog(tx, {
      actorId,
      action: "faq.update",
      entityType: "faq_item",
      entityId: id,
      changes: {
        before: {
          topic: current.topic,
          isPublished: current.isPublished,
          texts: Object.fromEntries(
            before.map(({ locale, faqItemId: _, ...text }) => [locale, text]),
          ),
        },
        after: { topic: form.topic, isPublished, texts: form.texts },
      },
    });
  });
}

/** Deletes an entry (translations cascade); the audit row keeps its questions. */
export async function deleteFaqItem(id: string, actorId: string) {
  await db.transaction(async (tx) => {
    const questions = await tx
      .select({ locale: faqItemTranslations.locale, question: faqItemTranslations.question })
      .from(faqItemTranslations)
      .where(eq(faqItemTranslations.faqItemId, id));
    const [deleted] = await tx
      .delete(faqItems)
      .where(eq(faqItems.id, id))
      .returning({ topic: faqItems.topic });
    if (!deleted) throw new ActionFailure("notFound");
    await writeAuditLog(tx, {
      actorId,
      action: "faq.delete",
      entityType: "faq_item",
      entityId: id,
      changes: {
        before: {
          topic: deleted.topic,
          questions: Object.fromEntries(questions.map((row) => [row.locale, row.question])),
        },
      },
    });
  });
}

/** Shows or hides an entry on the site. */
export async function setFaqItemPublished(id: string, isPublished: boolean, actorId: string) {
  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(faqItems)
      .set({ isPublished, updatedAt: new Date() })
      .where(eq(faqItems.id, id))
      .returning({ id: faqItems.id });
    if (!updated) throw new ActionFailure("notFound");
    await writeAuditLog(tx, {
      actorId,
      action: "faq.publish",
      entityType: "faq_item",
      entityId: id,
      changes: { isPublished },
    });
  });
}

/**
 * Saves the order of one topic's entries (`ids`, as dragged) and renumbers them 0, 1, 2, ….
 * Refused when that list changed since the page was loaded.
 */
export async function reorderFaqItems(ids: string[], moved: string, actorId: string) {
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select({ topic: faqItems.topic })
      .from(faqItems)
      .where(eq(faqItems.id, moved));
    if (!row) throw new ActionFailure("orderChanged");
    const rows = await tx
      .select({ id: faqItems.id, sortOrder: faqItems.sortOrder })
      .from(faqItems)
      .where(eq(faqItems.topic, row.topic))
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
      await tx.update(faqItems).set({ sortOrder: index }).where(eq(faqItems.id, id));
    }
    await writeAuditLog(tx, {
      actorId,
      action: "faq.reorder",
      entityType: "faq_item",
      entityId: moved,
      changes: { topic: row.topic, position: ids.indexOf(moved), order: ids },
    });
  });
}
