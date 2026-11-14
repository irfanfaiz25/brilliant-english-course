import "server-only";

import { and, desc, eq, ilike, isNull, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { limits } from "@/config/limits";
import { db } from "@/db/client";
import { mediaAssets, posts, postTranslations } from "@/db/schema";
import { mediaUrl } from "@/features/media/service";
import type { SessionUser } from "@/features/users/schema";
import type { Locale } from "@/i18n/routing";
import { assertCan } from "@/lib/permissions";

import {
  emptyPostText,
  postStatuses,
  type PostCategory,
  type PostFormInput,
  type PostStatus,
  type PostTextInput,
} from "./schema";
import { toJakartaInput } from "./service";

/** Posts by status for the admin overview (published, drafts), checked against the caller. */
export async function countPostsByStatus(
  actor: SessionUser,
): Promise<{ published: number; draft: number }> {
  assertCan(actor, "read", "blog");
  const rows = await db
    .select({ status: posts.status, count: sql<number>`count(*)::int` })
    .from(posts)
    .where(isNull(posts.deletedAt))
    .groupBy(posts.status);
  const count = (status: string) => rows.find((row) => row.status === status)?.count ?? 0;
  return { published: count("published"), draft: count("draft") };
}

export type AdminPostFilter = { query: string; status: PostStatus | null; page: number };

/** A row of the admin article list. */
export type AdminPostRow = {
  id: string;
  title: string;
  category: PostCategory;
  status: PostStatus;
  /** Published with a date still to come. */
  scheduled: boolean;
  hasEnglish: boolean;
  cover: { src: string; width: number; height: number } | null;
  publishedAt: Date | null;
  updatedAt: Date;
};

export type AdminPostList = {
  rows: AdminPostRow[];
  total: number;
  counts: Record<PostStatus | "all", number>;
  pageCount: number;
};

/** One page of articles (not deleted), newest change first. Checks `blog` read access. */
export async function getAdminPosts(
  actor: SessionUser,
  { query, status, page }: AdminPostFilter,
): Promise<AdminPostList> {
  assertCan(actor, "read", "blog");
  const idText = alias(postTranslations, "id_text");
  const enText = alias(postTranslations, "en_text");
  // `%` and `_` typed by the admin are literal characters, not wildcards.
  const search = query.trim().replace(/[\\%_]/g, "\\$&");
  const searchWhere: SQL | undefined = search
    ? or(ilike(idText.title, `%${search}%`), ilike(enText.title, `%${search}%`))
    : undefined;
  const live = isNull(posts.deletedAt);

  const grouped = await db
    .select({
      status: posts.status,
      count: sql<number>`count(*)::int`,
    })
    .from(posts)
    .innerJoin(idText, and(eq(idText.postId, posts.id), eq(idText.locale, "id")))
    .leftJoin(enText, and(eq(enText.postId, posts.id), eq(enText.locale, "en")))
    .where(and(live, searchWhere))
    .groupBy(posts.status);
  const counts = Object.fromEntries(
    postStatuses.map((value) => [value, grouped.find((row) => row.status === value)?.count ?? 0]),
  ) as Record<PostStatus, number>;
  const all = postStatuses.reduce((sum, value) => sum + counts[value], 0);
  const total = status ? counts[status] : all;
  const pageCount = Math.max(1, Math.ceil(total / limits.blog.adminPageSize));

  const rows = await db
    .select({
      id: posts.id,
      title: idText.title,
      category: posts.category,
      status: posts.status,
      publishedAt: posts.publishedAt,
      updatedAt: posts.updatedAt,
      hasEnglish: sql<boolean>`${enText.postId} is not null`,
      coverKey: mediaAssets.key,
      coverWidth: mediaAssets.width,
      coverHeight: mediaAssets.height,
    })
    .from(posts)
    .innerJoin(idText, and(eq(idText.postId, posts.id), eq(idText.locale, "id")))
    .leftJoin(enText, and(eq(enText.postId, posts.id), eq(enText.locale, "en")))
    .leftJoin(mediaAssets, eq(mediaAssets.id, posts.coverImageId))
    .where(and(live, searchWhere, status ? eq(posts.status, status) : undefined))
    .orderBy(desc(posts.updatedAt), desc(posts.id))
    .limit(limits.blog.adminPageSize)
    .offset((Math.min(page, pageCount) - 1) * limits.blog.adminPageSize);

  const now = Date.now();
  return {
    rows: rows.map(({ coverKey, coverWidth, coverHeight, ...row }) => ({
      ...row,
      scheduled:
        row.status === "published" && row.publishedAt !== null && row.publishedAt.getTime() > now,
      cover:
        coverKey && coverWidth && coverHeight
          ? { src: mediaUrl(coverKey), width: coverWidth, height: coverHeight }
          : null,
    })),
    total,
    counts: { ...counts, all },
    pageCount,
  };
}

/** A post as the admin form edits it, plus where it is live. */
export type PostForEdit = {
  values: PostFormInput;
  /** Its slug per written language, for "view on site" once it is published. */
  slugs: Partial<Record<Locale, string>>;
  live: boolean;
  updatedAt: Date;
};

/** One post for the edit form, or `null`. Checks `blog` read access. */
export async function getPostForEdit(actor: SessionUser, id: string): Promise<PostForEdit | null> {
  assertCan(actor, "read", "blog");
  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, id), isNull(posts.deletedAt)));
  if (!post) return null;
  const texts = await db.select().from(postTranslations).where(eq(postTranslations.postId, id));
  const text = (locale: Locale): PostTextInput => {
    const row = texts.find((entry) => entry.locale === locale);
    return row
      ? {
          title: row.title,
          slug: row.slug,
          excerpt: row.excerpt,
          coverAlt: row.coverAlt,
          content: row.content,
        }
      : emptyPostText();
  };
  return {
    values: {
      category: post.category,
      coverImageId: post.coverImageId ?? "",
      authorName: post.authorName,
      authorRole: post.authorRole,
      status: post.status,
      publishedAt: post.publishedAt ? toJakartaInput(post.publishedAt) : "",
      texts: { id: text("id"), en: text("en") },
    },
    slugs: Object.fromEntries(texts.map((row) => [row.locale, row.slug])),
    live:
      post.status === "published" &&
      post.publishedAt !== null &&
      post.publishedAt.getTime() <= Date.now(),
    updatedAt: post.updatedAt,
  };
}
