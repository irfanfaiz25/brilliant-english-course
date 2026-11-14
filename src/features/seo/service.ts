import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { seoOverrides } from "@/db/schema";
import { routing } from "@/i18n/routing";
import { writeAuditLog } from "@/lib/audit";

import type { PageSeo, SeoOverride } from "./schema";

type SaveOptions = {
  actorId: string;
  /** Only super admins may change `noindex` (ADR-008); for others the stored value is kept. */
  canSetNoindex: boolean;
};

const pageRows = (page: string) =>
  and(eq(seoOverrides.entityType, "page"), eq(seoOverrides.entityId, page));

/**
 * Stores the overrides of one static page for every locale with one audit row, in a transaction.
 * A locale left fully empty (no title, description or noindex) loses its row, so the defaults
 * apply again.
 */
export async function savePageSeo(
  { page, texts, noindex }: PageSeo,
  { actorId, canSetNoindex }: SaveOptions,
): Promise<void> {
  await db.transaction(async (tx) => {
    const previous = await tx
      .select({
        locale: seoOverrides.locale,
        title: seoOverrides.title,
        description: seoOverrides.description,
        noindex: seoOverrides.noindex,
      })
      .from(seoOverrides)
      .where(pageRows(page))
      .for("update");
    const before = Object.fromEntries(previous.map(({ locale, ...row }) => [locale, row]));
    const after: Record<string, SeoOverride> = {};

    for (const locale of routing.locales) {
      const row: SeoOverride = {
        ...texts[locale],
        noindex: canSetNoindex ? noindex : (before[locale]?.noindex ?? false),
      };
      if (row.title === null && row.description === null && !row.noindex) {
        await tx.delete(seoOverrides).where(and(pageRows(page), eq(seoOverrides.locale, locale)));
        continue;
      }
      after[locale] = row;
      await tx
        .insert(seoOverrides)
        .values({ entityType: "page", entityId: page, locale, ...row })
        .onConflictDoUpdate({
          target: [seoOverrides.entityType, seoOverrides.entityId, seoOverrides.locale],
          set: { ...row, updatedAt: new Date() },
        });
    }

    await writeAuditLog(tx, {
      actorId,
      action: "seo.update",
      entityType: "seo_page",
      entityId: page,
      changes: { before, after },
    });
  });
}
