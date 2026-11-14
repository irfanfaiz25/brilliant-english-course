import { z } from "zod";

import { testimonialAudiences } from "@/config/enums";
import { limits } from "@/config/limits";
import { integerField, textField } from "@/lib/form-schemas";

export { testimonialAudiences };

/** A published testimonial, resolved to one locale. */
export const testimonialSchema = z.object({
  id: z.string().min(1),
  audience: z.enum(testimonialAudiences),
  quote: z.string().min(10),
  author: z.string().min(1),
  /** Context line, e.g. "Orang tua siswa Kindy · Kab. Bogor". */
  role: z.string().min(1),
  rating: z.number().int().min(1).max(5),
});

export type Testimonial = z.infer<typeof testimonialSchema>;

/*
 * Admin form (Phase 4f). Both locales are required (short copy, bilingual site). The author's
 * name and the rating are shared; the quote and the context line are written per language.
 */

const T = limits.testimonials;

const testimonialTextSchema = z.object({
  quote: textField(T.quoteMin, T.quoteMax),
  role: textField(3, T.roleMax),
});

export const testimonialFormSchema = z.object({
  audience: z.enum(testimonialAudiences),
  authorName: textField(2, T.authorMax),
  rating: integerField(1, 5),
  isPublished: z.boolean(),
  texts: z.object({ id: testimonialTextSchema, en: testimonialTextSchema }),
});

export const testimonialUpdateSchema = testimonialFormSchema.extend({ id: z.uuid() });
export const testimonialIdSchema = z.object({ id: z.uuid() });
export const testimonialPublishSchema = testimonialIdSchema.extend({ isPublished: z.boolean() });

export type TestimonialAudience = (typeof testimonialAudiences)[number];
export type TestimonialFormInput = z.input<typeof testimonialFormSchema>;
export type TestimonialForm = z.output<typeof testimonialFormSchema>;
