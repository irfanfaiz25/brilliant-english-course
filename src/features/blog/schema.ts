import { z } from "zod";

import type { Locale } from "@/i18n/routing";
import { imageSchema } from "@/lib/schemas";

/** Post categories; the key is also the `?kategori=` value on the blog index. */
export const postCategories = ["tips-belajar", "parenting", "kegiatan", "kemitraan"] as const;
export type PostCategory = (typeof postCategories)[number];

export const postSlugSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

/* -------------------------------------------------------------------------------------------- */
/* Rich text: the subset of Tiptap's JSON document the blog editor (Phase 4e) is allowed to    */
/* produce. Stored as JSON, validated here and rendered on the server (`RichText`).            */
/* -------------------------------------------------------------------------------------------- */

const markSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("bold") }),
  z.object({ type: z.literal("italic") }),
  z.object({
    type: z.literal("link"),
    attrs: z.object({ href: z.string().regex(/^(https?:\/\/|\/|#|mailto:)/) }),
  }),
]);

const textSchema = z.object({
  type: z.literal("text"),
  text: z.string().min(1),
  marks: z.array(markSchema).optional(),
});
const hardBreakSchema = z.object({ type: z.literal("hardBreak") });
const inlineSchema = z.union([textSchema, hardBreakSchema]);

const paragraphSchema = z.object({
  type: z.literal("paragraph"),
  content: z.array(inlineSchema).optional(),
});
const headingSchema = z.object({
  type: z.literal("heading"),
  attrs: z.object({ level: z.union([z.literal(2), z.literal(3)]) }),
  content: z.array(inlineSchema).min(1),
});
const listItemSchema = z.object({
  type: z.literal("listItem"),
  content: z.array(paragraphSchema).min(1),
});
const bulletListSchema = z.object({
  type: z.literal("bulletList"),
  content: z.array(listItemSchema).min(1),
});
const orderedListSchema = z.object({
  type: z.literal("orderedList"),
  content: z.array(listItemSchema).min(1),
});
const blockquoteSchema = z.object({
  type: z.literal("blockquote"),
  content: z.array(paragraphSchema).min(1),
});

export const blockSchema = z.discriminatedUnion("type", [
  paragraphSchema,
  headingSchema,
  bulletListSchema,
  orderedListSchema,
  blockquoteSchema,
]);

export const richTextDocSchema = z.object({
  type: z.literal("doc"),
  content: z.array(blockSchema).min(1),
});

export type RichTextMark = z.infer<typeof markSchema>;
export type RichTextInline = z.infer<typeof inlineSchema>;
export type RichTextParagraph = z.infer<typeof paragraphSchema>;
export type RichTextBlock = z.infer<typeof blockSchema>;
export type RichTextDoc = z.infer<typeof richTextDocSchema>;

/* -------------------------------------------------------------------------------------------- */
/* Posts                                                                                         */
/* -------------------------------------------------------------------------------------------- */

const postTranslationSchema = z.object({
  slug: postSlugSchema,
  title: z.string().min(5).max(110),
  /** Card teaser and meta description. */
  excerpt: z.string().min(20).max(200),
  coverAlt: z.string().min(1),
  content: richTextDocSchema,
});

/** A stored post with every translation (`posts` + `post_translations` from Phase 3). */
export const postRecordSchema = z.object({
  id: z.string().min(1),
  category: z.enum(postCategories),
  cover: imageSchema.omit({ alt: true }),
  author: z.object({ name: z.string().min(1), role: z.string().min(1) }),
  publishedAt: z.iso.date(),
  updatedAt: z.iso.date().optional(),
  translations: z.object({ id: postTranslationSchema, en: postTranslationSchema }),
});

export type PostRecord = z.infer<typeof postRecordSchema>;

/** A published post resolved to one locale, as shown on cards. */
export type PostSummary = {
  id: string;
  slug: string;
  /** Slug per locale, for the language switcher and hreflang alternates. */
  slugs: Record<Locale, string>;
  category: PostCategory;
  title: string;
  excerpt: string;
  cover: z.infer<typeof imageSchema>;
  author: PostRecord["author"];
  publishedAt: string;
  updatedAt?: string;
  readingMinutes: number;
};

/** A full post resolved to one locale. */
export type Post = PostSummary & { content: RichTextDoc };
