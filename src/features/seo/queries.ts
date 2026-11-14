import "server-only";

import { and, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";
import { db } from "@/db/client";
import { seoOverrides } from "@/db/schema";
import { readSetting } from "@/features/settings/queries";
import type { Locale } from "@/i18n/routing";

import {
  seoDefaultsSchema,
  type SeoDefaults,
  type SeoEntityType,
  type SeoOverride,
} from "./schema";

/** The admin override of one entity in `locale`, or `null` when there is none. */
export async function getSeoOverride(
  entityType: SeoEntityType,
  entityId: string,
  locale: Locale,
): Promise<SeoOverride | null> {
  "use cache";
  cacheTag(cacheTags.seo);
  cacheLife("hours");
  const [row] = await db
    .select({
      title: seoOverrides.title,
      description: seoOverrides.description,
      noindex: seoOverrides.noindex,
    })
    .from(seoOverrides)
    .where(
      and(
        eq(seoOverrides.entityType, entityType),
        eq(seoOverrides.entityId, entityId),
        eq(seoOverrides.locale, locale),
      ),
    );
  return row ?? null;
}

/** The saved site-wide SEO defaults, or `null` while the message defaults apply. */
export async function getSeoDefaults(): Promise<SeoDefaults | null> {
  return readSetting("seo", seoDefaultsSchema.nullable(), null);
}
