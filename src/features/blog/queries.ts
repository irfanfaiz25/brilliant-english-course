import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";
import { routing, type Locale } from "@/i18n/routing";

import { postFixtures } from "./fixtures";
import type { Post, PostCategory, PostSummary } from "./schema";
import { toPost, toSummary } from "./service";

/** Published posts, newest first. Reads fixtures until the blog admin lands (Phase 4e). */
async function getPosts(locale: Locale): Promise<Post[]> {
  "use cache";
  cacheTag(cacheTags.blog);
  cacheLife("hours");
  return postFixtures
    .map((record) => toPost(record, locale))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
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
  const posts = await getPosts(locale);
  return posts.find((post) => post.slug === slug) ?? null;
}

/**
 * The slug of the same post in `locale` when `slug` belongs to another language (the language
 * switcher keeps the slug, so `/en/blog/<indonesian-slug>` redirects to the English slug).
 */
export async function findTranslatedSlug(locale: Locale, slug: string): Promise<string | null> {
  for (const other of routing.locales) {
    if (other === locale) continue;
    const post = await getPostBySlug(other, slug);
    if (post) return post.slugs[locale];
  }
  return null;
}

/** Slugs to prerender per locale. */
export async function getPostSlugs(locale: Locale): Promise<string[]> {
  const posts = await getPosts(locale);
  return posts.map((post) => post.slug);
}
