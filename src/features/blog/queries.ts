import "server-only";

import { and, desc, eq, exists, inArray, isNotNull, isNull, lte, sql, type SQL } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";
import { db } from "@/db/client";
import { mediaAssets, posts, postTranslations } from "@/db/schema";
import { mediaUrl } from "@/features/media/service";
import { routing, type Locale } from "@/i18n/routing";
import { groupTranslations } from "@/lib/translations";

import type { Post, PostCategory, PostRecord, PostSummary } from "./schema";
import { toPost, toSummary, toPostRecord } from "./service";

/**
 * Published, non-deleted posts (publish date reached), newest first, as stored records;
 * optionally only those matching `where`. Not cached itself: the callers below are.
 */
async function loadPostRecords(where?: SQL): Promise<PostRecord[]> {
  const rows = await db
    .select({ post: posts, cover: mediaAssets })
    .from(posts)
    .innerJoin(mediaAssets, eq(mediaAssets.id, posts.coverImageId))
    .where(
      and(
        eq(posts.status, "published"),
        isNull(posts.deletedAt),
        isNotNull(posts.publishedAt),
        lte(posts.publishedAt, sql`now()`),
        where,
      ),
    )
    .orderBy(desc(posts.publishedAt));
  if (rows.length === 0) return [];

  const translations = await db
    .select()
    .from(postTranslations)
    .where(
      inArray(
        postTranslations.postId,
        rows.map((row) => row.post.id),
      ),
    );
  const byPost = groupTranslations(translations, (row) => row.postId);

  return rows.flatMap(({ post, cover }) => {
    const texts = byPost.get(post.id) ?? [];
    // Exact languages, no fallback: a post without English must not appear on /en in Indonesian.
    const id = texts.find((text) => text.locale === "id");
    const en = texts.find((text) => text.locale === "en");
    // Indonesian is required; English is optional (the post is then not listed on /en).
    if (!id || !post.publishedAt) return [];
    return [
      toPostRecord({
        id: post.id,
        category: post.category,
        cover: { src: mediaUrl(cover.key), width: cover.width, height: cover.height },
        author: { name: post.authorName, role: post.authorRole },
        publishedAt: post.publishedAt,
        updatedAt: post.updatedAt,
        translations: { id, ...(en ? { en } : {}) },
      }),
    ];
  });
}

/** Every published post (the index, related posts, prerendered slugs). */
async function getPostRecords(): Promise<PostRecord[]> {
  "use cache";
  cacheTag(cacheTags.blog);
  cacheLife("hours");
  return loadPostRecords();
}

/**
 * The published post with `slug` in `locale`, cached per slug. The article page looks posts up
 * here, not in the full list: a slug that was not prerendered (a post published after the build)
 * renders from the route's fallback shell, whose saved copy of the full list predates the post.
 */
async function getPostRecordBySlug(locale: Locale, slug: string): Promise<PostRecord | null> {
  "use cache";
  cacheTag(cacheTags.blog);
  cacheLife("hours");
  const [record] = await loadPostRecords(
    exists(
      db
        .select({ one: sql`1` })
        .from(postTranslations)
        .where(
          and(
            eq(postTranslations.postId, posts.id),
            eq(postTranslations.locale, locale),
            eq(postTranslations.slug, slug),
          ),
        ),
    ),
  );
  return record ?? null;
}

/** Published posts resolved to `locale`, newest first. */
async function getPosts(locale: Locale): Promise<Post[]> {
  return (await getPostRecords()).flatMap((record) => {
    const post = toPost(record, locale);
    return post ? [post] : [];
  });
}

/** Card data for the index, optionally limited to one category. */
export async function getPostSummaries(
  locale: Locale,
  category?: PostCategory,
): Promise<PostSummary[]> {
  const posts = await getPosts(locale);
  return posts.filter((post) => !category || post.category === category).map(toSummary);
}

/** A post by its slug in `locale`, or `null`. */
export async function getPostBySlug(locale: Locale, slug: string): Promise<Post | null> {
  const record = await getPostRecordBySlug(locale, slug);
  return record ? toPost(record, locale) : null;
}

/**
 * Where `slug` of another language leads in `locale` (the language switcher keeps the slug):
 * the same post's slug in `locale`, `"untranslated"` when that post is not written in `locale`,
 * or `null` when no post has the slug.
 */
export async function findTranslatedSlug(
  locale: Locale,
  slug: string,
): Promise<string | "untranslated" | null> {
  for (const other of routing.locales) {
    if (other === locale) continue;
    const post = await getPostBySlug(other, slug);
    if (post) return post.slugs[locale] ?? "untranslated";
  }
  return null;
}

/** Slugs to prerender per locale. */
export async function getPostSlugs(locale: Locale): Promise<string[]> {
  const posts = await getPosts(locale);
  return posts.map((post) => post.slug);
}
