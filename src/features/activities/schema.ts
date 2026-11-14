import { z } from "zod";

import { limits } from "@/config/limits";
import { imageIdField, textField } from "@/lib/form-schemas";
import { imageSchema } from "@/lib/schemas";

/** A recurring unit activity (Story Telling Day, …), resolved to one locale. */
export const activitySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  summary: z.string().min(1),
  /** Short audience label, e.g. "Semua level". */
  audience: z.string().min(1),
  image: imageSchema,
});

export type Activity = z.infer<typeof activitySchema>;

/*
 * Admin form (Phase 4b). Both locales are required (short copy, bilingual site); the slug is
 * derived from the Indonesian name when the activity is created and never changes.
 */

const A = limits.activities;

const activityTextSchema = z.object({
  name: textField(2, A.nameMax),
  summary: textField(20, A.summaryMax),
  audience: textField(2, A.audienceMax),
  imageAlt: textField(3, limits.imageAltMax),
});

export const activityFormSchema = z.object({
  imageId: imageIdField,
  isPublished: z.boolean(),
  texts: z.object({ id: activityTextSchema, en: activityTextSchema }),
});

export const activityUpdateSchema = activityFormSchema.extend({ id: z.uuid() });
export const activityIdSchema = z.object({ id: z.uuid() });
export const activityPublishSchema = activityIdSchema.extend({ isPublished: z.boolean() });

export type ActivityFormInput = z.input<typeof activityFormSchema>;
export type ActivityForm = z.output<typeof activityFormSchema>;
export type ActivityText = z.output<typeof activityTextSchema>;
