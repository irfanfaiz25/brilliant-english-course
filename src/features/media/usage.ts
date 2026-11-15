import "server-only";

import { and, eq, exists, inArray, isNull, or, sql, type SQL } from "drizzle-orm";

import { adminRoutes } from "@/config/admin-routes";
import { db } from "@/db/client";
import {
  activities,
  activityTranslations,
  postImages,
  posts,
  postTranslations,
  programLevels,
  programLevelTranslations,
  seoOverrides,
  settings,
  unitPhotos,
  units,
} from "@/db/schema";
import type { SettingKey } from "@/features/settings/keys";

/*
 * Where an image is used. Every table that references `media_assets` is listed here once, so the
 * library's counts, the detail page and the delete guard always agree. Deleted units and posts do
 * not count: their rows stay only for the audit trail.
 */

/**
 * Settings whose JSON may hold photo ids: the Kemitraan page sections (ADR-041). Ids are UUIDs, so
 * a text search of the document finds exactly the photos it uses.
 */
const pagePhotoKeys: readonly SettingKey[] = ["partnership", "partnershipTraining"];

/** The library row in correlated subqueries (Drizzle leaves columns unqualified there). */
const assetIdColumn = sql`"media_assets"."id"`;

/**
 * Number of places using an asset: by default the `media_assets` row of the outer query, or the
 * asset with the given id. Table names are aliased so nothing is ambiguous inside the subqueries.
 */
export function usageCount(mediaId: string | SQL = assetIdColumn): SQL<number> {
  return sql<number>`(
    (select count(*) from activities a where a.image_id = ${mediaId})
    + (select count(*) from program_levels pl where pl.image_id = ${mediaId})
    + (select count(*) from posts p where p.deleted_at is null and (
        p.cover_image_id = ${mediaId}
        or exists (select 1 from post_images pi where pi.post_id = p.id and pi.media_id = ${mediaId})
      ))
    + (select count(*) from seo_overrides so where so.og_image_id = ${mediaId})
    + (select count(*) from unit_photos up join units u on u.id = up.unit_id
        where up.media_id = ${mediaId} and u.deleted_at is null)
    + (select count(*) from settings st
        where st.key in (${sql.join(
          pagePhotoKeys.map((key) => sql`${key}`),
          sql`, `,
        )})
        and position(${mediaId}::text in st.value::text) > 0)
  )::int`;
}

export type MediaUsageKind = "activity" | "program" | "post" | "seo" | "unit" | "page";

/** One place an image is used; `href` opens it in admin (`null` while its module is planned). */
export type MediaUsage = { kind: MediaUsageKind; label: string; href: string | null };

/** Every place using the asset, grouped by kind. */
export async function listUsages(mediaId: string): Promise<MediaUsage[]> {
  const [activityRows, levelRows, postRows, seoRows, unitRows, pageRows] = await Promise.all([
    db
      .select({ id: activities.id, name: activityTranslations.name })
      .from(activities)
      .innerJoin(
        activityTranslations,
        and(
          eq(activityTranslations.activityId, activities.id),
          eq(activityTranslations.locale, "id"),
        ),
      )
      .where(eq(activities.imageId, mediaId)),
    db
      .select({ slug: programLevels.slug, name: programLevelTranslations.name })
      .from(programLevels)
      .innerJoin(
        programLevelTranslations,
        and(
          eq(programLevelTranslations.levelId, programLevels.id),
          eq(programLevelTranslations.locale, "id"),
        ),
      )
      .where(eq(programLevels.imageId, mediaId)),
    db
      .select({ id: posts.id, title: postTranslations.title })
      .from(posts)
      .innerJoin(
        postTranslations,
        and(eq(postTranslations.postId, posts.id), eq(postTranslations.locale, "id")),
      )
      .where(
        and(
          isNull(posts.deletedAt),
          or(
            eq(posts.coverImageId, mediaId),
            exists(
              db
                .select({ one: sql`1` })
                .from(postImages)
                .where(and(eq(postImages.postId, posts.id), eq(postImages.mediaId, mediaId))),
            ),
          ),
        ),
      ),
    db
      .select({
        entityType: seoOverrides.entityType,
        entityId: seoOverrides.entityId,
        locale: seoOverrides.locale,
      })
      .from(seoOverrides)
      .where(eq(seoOverrides.ogImageId, mediaId)),
    db
      .selectDistinct({ id: units.id, name: units.name })
      .from(unitPhotos)
      .innerJoin(units, eq(units.id, unitPhotos.unitId))
      .where(and(eq(unitPhotos.mediaId, mediaId), isNull(units.deletedAt))),
    db
      .select({ key: settings.key })
      .from(settings)
      .where(
        and(
          inArray(settings.key, [...pagePhotoKeys]),
          sql`position(${mediaId} in ${settings.value}::text) > 0`,
        ),
      )
      .limit(1),
  ]);

  return [
    ...levelRows.map((row) => ({
      kind: "program" as const,
      label: row.name,
      href: `${adminRoutes.programs}/${row.slug}`,
    })),
    ...activityRows.map((row) => ({
      kind: "activity" as const,
      label: row.name,
      href: `${adminRoutes.activities}/${row.id}`,
    })),
    ...unitRows.map((row) => ({
      kind: "unit" as const,
      label: row.name,
      href: `${adminRoutes.units}/${row.id}`,
    })),
    ...postRows.map((row) => ({
      kind: "post" as const,
      label: row.title,
      href: `${adminRoutes.blog}/${row.id}`,
    })),
    ...pageRows.map(() => ({
      kind: "page" as const,
      label: "Kemitraan",
      href: adminRoutes.partnershipPage,
    })),
    ...seoRows.map((row) => ({
      kind: "seo" as const,
      label: `${row.entityType} ${row.entityId} (${row.locale.toUpperCase()})`,
      href: adminRoutes.seo,
    })),
  ];
}
