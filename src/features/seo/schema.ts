import { z } from "zod";

import { seoEntityTypes } from "@/config/enums";
import { limits } from "@/config/limits";

/** What an override belongs to: a static page, or a program, post or unit (their modules). */
export { seoEntityTypes };
export type SeoEntityType = (typeof seoEntityTypes)[number];

/** Static public pages whose metadata admins can override (route keys of `seo_overrides`). */
export const seoPageKeys = [
  "home",
  "program",
  "finder",
  "units",
  "partnership",
  "blog",
  "contact",
] as const;
export type SeoPageKey = (typeof seoPageKeys)[number];

/*
 * Form schemas shared by the admin forms and the Server Actions. Messages are stable codes
 * translated by the forms (`AdminSeo.errors.<code>`). An empty field means "use the default".
 */

const optionalText = (max: number, tooLong: string) =>
  z
    .string()
    .trim()
    .max(max, tooLong)
    .transform((value) => value || null);

/** Title and description override of one locale. */
export const seoTextSchema = z.object({
  title: optionalText(limits.seo.titleMax, "titleTooLong"),
  description: optionalText(limits.seo.descriptionMax, "descriptionTooLong").refine(
    (value) => value === null || value.length >= limits.seo.descriptionMin,
    "descriptionTooShort",
  ),
});

/** Overrides of one static page in every locale. `noindex` is applied only for super admins. */
export const pageSeoSchema = z.object({
  page: z.enum(seoPageKeys),
  texts: z.object({ id: seoTextSchema, en: seoTextSchema }),
  noindex: z.boolean(),
});

const defaultDescription = z
  .string()
  .trim()
  .min(limits.seo.descriptionMin, "descriptionTooShort")
  .max(limits.seo.descriptionMax, "descriptionTooLong");

/** The `seo` setting: the site-wide description used when a page has none of its own. */
export const seoDefaultsSchema = z.object({
  description: z.object({ id: defaultDescription, en: defaultDescription }),
});

export type SeoText = z.infer<typeof seoTextSchema>;
export type PageSeoInput = z.input<typeof pageSeoSchema>;
export type PageSeo = z.infer<typeof pageSeoSchema>;
export type SeoDefaults = z.infer<typeof seoDefaultsSchema>;
export type SeoDefaultsInput = z.input<typeof seoDefaultsSchema>;

/** A stored override of one entity in one locale. */
export type SeoOverride = { title: string | null; description: string | null; noindex: boolean };

/** Metadata a page derives from its own content before overrides. */
export type DerivedSeo = {
  title: string;
  description: string | null;
  /** The title is complete (home page), so the site-name template is not added. */
  absoluteTitle: boolean;
};
