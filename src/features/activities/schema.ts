import { z } from "zod";

import { limits } from "@/config/limits";
import { imageIdField, rowListField, textField } from "@/lib/form-schemas";
import { imageSchema } from "@/lib/schemas";

/** A recurring unit activity (Story Telling Day, …), resolved to one locale. */
export const activitySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  summary: z.string().min(1),
  /** Short audience label, e.g. "Semua level". */
  audience: z.string().min(1),
  image: imageSchema,
  /** Detail popup (ADR-042); every field may be empty, and the popup leaves it out. */
  description: z.string(),
  /** What children do, as short points. */
  highlights: z.array(z.string().min(1)),
  /** Skills practised, shown as chips ("Speaking", "Confidence"). */
  skills: z.array(z.string().min(1)),
  /** When units hold it, e.g. "Setiap akhir bulan". */
  schedule: z.string(),
  /** More photos for the popup, after the card photo. */
  photos: z.array(z.object({ image: imageSchema, caption: z.string() })),
});

export type Activity = z.infer<typeof activitySchema>;

/*
 * Admin form (Phase 4b, details from ADR-042). The card copy is required in both locales (short,
 * bilingual site); the popup details are optional. The slug is derived from the Indonesian name
 * when the activity is created and never changes.
 */

const A = limits.activities;

const activityTextSchema = z.object({
  name: textField(2, A.nameMax),
  summary: textField(20, A.summaryMax),
  audience: textField(2, A.audienceMax),
  imageAlt: textField(3, limits.imageAltMax),
  description: textField(0, A.descriptionMax),
  schedule: textField(0, A.scheduleMax),
  highlights: rowListField(textField(2, A.highlightMax), 0, A.highlightsMax),
  skills: rowListField(textField(2, A.skillMax), 0, A.skillsMax),
});

/** A gallery photo of the popup with its optional caption per locale. */
const activityPhotoSchema = z.object({
  imageId: z.uuid("imageRequired"),
  caption: z.object({ id: textField(0, A.captionMax), en: textField(0, A.captionMax) }),
});

export const activityFormSchema = z.object({
  imageId: imageIdField,
  isPublished: z.boolean(),
  texts: z.object({ id: activityTextSchema, en: activityTextSchema }),
  photos: z.array(activityPhotoSchema).max(A.photosMax, `tooMany:${A.photosMax}`),
});

export const activityUpdateSchema = activityFormSchema.extend({ id: z.uuid() });
export const activityIdSchema = z.object({ id: z.uuid() });
export const activityPublishSchema = activityIdSchema.extend({ isPublished: z.boolean() });

export type ActivityFormInput = z.input<typeof activityFormSchema>;
export type ActivityForm = z.output<typeof activityFormSchema>;
export type ActivityText = z.output<typeof activityTextSchema>;
