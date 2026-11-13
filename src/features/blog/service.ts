import { limits } from "@/config/limits";
import type { Locale } from "@/i18n/routing";

import type {
  Post,
  PostRecord,
  PostSummary,
  RichTextBlock,
  RichTextDoc,
  RichTextInline,
} from "./schema";

/** Plain text of inline nodes (marks dropped, hard breaks as spaces). */
export function inlineText(nodes: readonly RichTextInline[] = []): string {
  return nodes.map((node) => (node.type === "text" ? node.text : " ")).join("");
}

function blockText(block: RichTextBlock): string {
  switch (block.type) {
    case "paragraph":
    case "heading":
      return inlineText(block.content);
    case "bulletList":
    case "orderedList":
      return block.content
        .flatMap((item) => item.content.map((paragraph) => inlineText(paragraph.content)))
        .join(" ");
    case "blockquote":
      return block.content.map((paragraph) => inlineText(paragraph.content)).join(" ");
  }
}

/** Whole document as plain text (reading time, search, meta fallbacks). */
export function documentText(doc: RichTextDoc): string {
  return doc.content.map(blockText).join(" ");
}

/** Minutes to read at `limits.blog.wordsPerMinute`, at least 1. */
export function readingMinutes(doc: RichTextDoc): number {
  const words = documentText(doc).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / limits.blog.wordsPerMinute));
}

/** URL-safe anchor: lowercase ASCII words joined by dashes ("Tips & Trik!" → "tips-trik"). */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type PostHeading = { id: string; text: string; level: 2 | 3 };

/**
 * Headings for the table of contents, with unique anchor ids in document order. `RichText`
 * uses the same function, so ids in the TOC and in the article always match.
 */
export function extractHeadings(doc: RichTextDoc): PostHeading[] {
  const seen = new Map<string, number>();
  return doc.content.flatMap((block) => {
    if (block.type !== "heading") return [];
    const text = inlineText(block.content).trim();
    const base = slugify(text) || "bagian";
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return [{ id: count === 0 ? base : `${base}-${count + 1}`, text, level: block.attrs.level }];
  });
}

/** Resolves a stored post to one locale. */
export function toPost(record: PostRecord, locale: Locale): Post {
  const translation = record.translations[locale];
  return {
    id: record.id,
    slug: translation.slug,
    slugs: { id: record.translations.id.slug, en: record.translations.en.slug },
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
