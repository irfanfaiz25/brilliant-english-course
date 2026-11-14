import { z } from "zod";

import { postCategories, postStatuses } from "@/config/enums";
import { limits } from "@/config/limits";
import type { Locale } from "@/i18n/routing";
import { imageIdField, textField } from "@/lib/form-schemas";
import { imageSchema } from "@/lib/schemas";
import { slugSchemaPattern } from "@/lib/slug";

import { hasContent, sanitizeDoc, type RichTextDoc } from "./rich-text";

/** Post categories; the key is also the `?kategori=` value on the blog index. */
export { postCategories, postStatuses };
export type PostCategory = (typeof postCategories)[number];
export type PostStatus = (typeof postStatuses)[number];

export const postSlugSchema = z.string().regex(slugSchemaPattern);

/* -------------------------------------------------------------------------------------------- */
/* Rich text: the Tiptap JSON subset in `rich-text.ts`, stored as JSON, rendered on the server.  */
/* -------------------------------------------------------------------------------------------- */

export type {
  RichTextBlock,
  RichTextDoc,
  RichTextHeading,
  RichTextImage,
  RichTextInline,
  RichTextList,
  RichTextListItem,
  RichTextMark,
  RichTextParagraph,
  RichTextTable,
} from "./rich-text";

/**
 * A rich-text document, reduced to the allowed subset (`sanitizeDoc`) and required to have
 * something to read. The output is always a clean `RichTextDoc`.
 */
export const richTextDocSchema = z
  .unknown()
  .transform((value) => sanitizeDoc(value))
  .refine(hasContent, "contentRequired");

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
  /** Indonesian is required; a post without English is not listed on `/en` (ADR-032). */
  translations: z.object({ id: postTranslationSchema, en: postTranslationSchema.optional() }),
});

export type PostRecord = z.infer<typeof postRecordSchema>;

/** A published post resolved to one locale, as shown on cards. */
export type PostSummary = {
  id: string;
  slug: string;
  /** Slug per locale it is written in, for the language switcher and hreflang alternates. */
  slugs: Partial<Record<Locale, string>>;
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

/* -------------------------------------------------------------------------------------------- */
/* Admin form (Phase 4e)                                                                         */
/* -------------------------------------------------------------------------------------------- */

const B = limits.blog;

/** One language of a post as the admin form edits it. */
const postTextSchema = z.object({
  title: textField(B.titleMin, B.titleMax),
  slug: z
    .string()
    .trim()
    .min(1, "required")
    .max(B.slugMax, `tooLong:${B.slugMax}`)
    // Only a filled-in slug can have a wrong format; an empty one is reported as required.
    .refine((slug) => slug === "" || slugSchemaPattern.test(slug), "slugInvalid"),
  excerpt: textField(B.excerptMin, B.excerptMax),
  coverAlt: textField(1, limits.imageAltMax),
  content: richTextDocSchema,
});

const postTextInput = z.object({
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  coverAlt: z.string(),
  content: z.unknown(),
});

/** An English version is either left empty (no translation) or complete. */
const optionalPostText = postTextInput.transform((value, ctx) => {
  const blank =
    [value.title, value.slug, value.excerpt, value.coverAlt].every((text) => !text.trim()) &&
    !hasContent(sanitizeDoc(value.content));
  if (blank) return null;
  const parsed = postTextSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  for (const issue of parsed.error.issues) {
    ctx.addIssue({
      code: "custom",
      path: issue.path,
      // An empty field of a started translation: say the whole version must be complete.
      message: issue.message === "required" ? "translationIncomplete" : issue.message,
    });
  }
  return z.NEVER;
});

/** `datetime-local` value ("2026-11-14T09:30"), read as Jakarta time; empty = not set. */
export const publishedAtField = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value), "dateInvalid");

export const postFormSchema = z.object({
  category: z.enum(postCategories),
  coverImageId: imageIdField,
  authorName: textField(2, B.authorMax),
  authorRole: textField(2, B.authorMax),
  status: z.enum(postStatuses),
  publishedAt: publishedAtField,
  texts: z.object({ id: postTextSchema, en: optionalPostText }),
});
export type PostFormInput = z.input<typeof postFormSchema>;
export type PostForm = z.output<typeof postFormSchema>;
/** The values of one language in the form (before parsing). */
export type PostTextInput = z.input<typeof postTextInput>;

export const postUpdateSchema = postFormSchema.and(z.object({ id: z.uuid() }));
export const postIdSchema = z.object({ id: z.uuid() });

/** An empty language in the form. */
export const emptyPostText = (): PostTextInput => ({
  title: "",
  slug: "",
  excerpt: "",
  coverAlt: "",
  content: { type: "doc", content: [] },
});
