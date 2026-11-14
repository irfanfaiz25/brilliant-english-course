import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { seoOverrides } from "@/db/schema";
import type { SessionUser } from "@/features/users/schema";
import type { Locale } from "@/i18n/routing";
import { assertCan } from "@/lib/permissions";

import type { SeoOverride, SeoPageKey } from "./schema";

/** Stored overrides of the static pages, by page and locale (missing = defaults apply). */
export type PageOverrides = Partial<Record<SeoPageKey, Partial<Record<Locale, SeoOverride>>>>;

/** All static-page overrides for the SEO module. Uncached; checks `seo` read access. */
export async function getPageOverrides(actor: SessionUser): Promise<PageOverrides> {
  assertCan(actor, "read", "seo");
  const rows = await db
    .select({
      entityId: seoOverrides.entityId,
      locale: seoOverrides.locale,
      title: seoOverrides.title,
      description: seoOverrides.description,
      noindex: seoOverrides.noindex,
    })
    .from(seoOverrides)
    .where(eq(seoOverrides.entityType, "page"));

  const overrides: PageOverrides = {};
  for (const { entityId, locale, ...override } of rows) {
    const page = entityId as SeoPageKey;
    overrides[page] = { ...overrides[page], [locale]: override };
  }
  return overrides;
}
