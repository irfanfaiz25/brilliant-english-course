import { limits } from "@/config/limits";
import { slugify } from "@/lib/slug";
import type { Locale } from "@/i18n/routing";

import { documentText, inlineText } from "./rich-text";
import type { Post, PostRecord, PostSummary, RichTextDoc } from "./schema";
import { adminTimeZone } from "@/config/admin-routes";

export { documentText, inlineText } from "./rich-text";

/** Minutes to read at `limits.blog.wordsPerMinute`, at least 1. */
export function readingMinutes(doc: RichTextDoc): number {
  const words = documentText(doc).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / limits.blog.wordsPerMinute));
}

export type PostHeading = { id: string; text: string; level: 2 | 3 };

/**
 * Headings for the table of contents, with unique anchor ids in document order. `RichText`
 * uses the same function, so ids in the TOC and in the article always match.
 */
export function extractHeadings(doc: RichTextDoc): PostHeading[] {
  const seen = new Map<string, number>();
  return doc.content.flatMap((block) => {
    // The table of contents lists the two main levels; h4 stays a sub-point inside a section.
    if (block.type !== "heading" || block.attrs.level === 4) return [];
    const text = inlineText(block.content).trim();
    const base = slugify(text) || "bagian";
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return [
      { id: count === 0 ? base : `${base}-${count + 1}`, text, level: block.attrs.level as 2 | 3 },
    ];
  });
}

/** An instant as a `datetime-local` value in Jakarta time ("2026-11-14T09:30"). */
export function toJakartaInput(instant: Date): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: adminTimeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** A `datetime-local` value read as Jakarta time (UTC+7, no daylight saving). */
export const fromJakartaInput = (value: string): Date => new Date(`${value}:00+07:00`);

/** Calendar date of an instant in Indonesia's western time zone ("2026-11-06"), as posts show it. */
export function jakartaDate(instant: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: adminTimeZone }).format(instant);
}

type StoredTranslation = PostRecord["translations"]["id"];

/** The database shape of a post, before dates become calendar days. */
export type StoredPost = Omit<PostRecord, "publishedAt" | "updatedAt" | "translations"> & {
  publishedAt: Date;
  updatedAt: Date;
  translations: { id: StoredTranslation; en?: StoredTranslation };
};

/**
 * A `PostRecord` from database rows. `updatedAt` is kept only when the post changed on a later
 * day than it was published, so a typo fix on publish day does not show "Diperbarui".
 */
export function toPostRecord(stored: StoredPost): PostRecord {
  const published = jakartaDate(stored.publishedAt);
  const updated = jakartaDate(stored.updatedAt);
  const pick = ({ slug, title, excerpt, coverAlt, content }: StoredTranslation) => ({
    slug,
    title,
    excerpt,
    coverAlt,
    content,
  });
  return {
    id: stored.id,
    category: stored.category,
    cover: stored.cover,
    author: stored.author,
    publishedAt: published,
    ...(updated > published ? { updatedAt: updated } : {}),
    translations: {
      id: pick(stored.translations.id),
      ...(stored.translations.en ? { en: pick(stored.translations.en) } : {}),
    },
  };
}

/** Resolves a stored post to one locale; `null` when it is not written in that locale. */
export function toPost(record: PostRecord, locale: Locale): Post | null {
  const translation = record.translations[locale];
  if (!translation) return null;
  return {
    id: record.id,
    slug: translation.slug,
    slugs: {
      id: record.translations.id.slug,
      ...(record.translations.en ? { en: record.translations.en.slug } : {}),
    },
    category: record.category,
    title: translation.title,
    excerpt: translation.excerpt,
    cover: { ...record.cover, alt: translation.coverAlt },
    author: record.author,
    publishedAt: record.publishedAt,
    updatedAt: record.updatedAt,
    readingMinutes: readingMinutes(translation.content),
    content: translation.content,
  };
}

/** Card data only (drops the document). */
export function toSummary({ content, ...summary }: Post): PostSummary {
  void content;
  return summary;
}

export type PostPage = {
  featured: PostSummary | null;
  items: PostSummary[];
  page: number;
  totalPages: number;
  total: number;
};

/**
 * One page of the blog index. Unfiltered page 1 lifts the newest post into a featured slot;
 * out-of-range pages clamp to the last page.
 */
export function paginatePosts(
  posts: readonly PostSummary[],
  {
    page,
    featureFirst,
    pageSize = limits.blog.pageSize,
  }: {
    page: number;
    featureFirst: boolean;
    pageSize?: number;
  },
): PostPage {
  const featured = featureFirst ? (posts[0] ?? null) : null;
  const rest = featured ? posts.slice(1) : [...posts];
  const totalPages = Math.max(1, Math.ceil(rest.length / pageSize));
  const current = Math.min(Math.max(1, Math.trunc(page) || 1), totalPages);
  return {
    featured: current === 1 ? featured : null,
    items: rest.slice((current - 1) * pageSize, current * pageSize),
    page: current,
    totalPages,
    total: posts.length,
  };
}

/** Same-category posts first (newest first), topped up with the latest others. */
export function relatedPosts(
  posts: readonly PostSummary[],
  current: Pick<PostSummary, "id" | "category">,
  count: number = limits.blog.relatedPosts,
): PostSummary[] {
  const others = posts.filter((post) => post.id !== current.id);
  const sameCategory = others.filter((post) => post.category === current.category);
  const rest = others.filter((post) => post.category !== current.category);
  return [...sameCategory, ...rest].slice(0, count);
}
