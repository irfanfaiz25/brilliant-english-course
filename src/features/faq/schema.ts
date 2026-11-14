import { z } from "zod";

import { faqTopics } from "@/config/enums";
import { limits } from "@/config/limits";
import { textField } from "@/lib/form-schemas";

export { faqTopics };

/** One FAQ entry, resolved to one locale. Answers are plain text (also used for FAQPage JSON-LD). */
export const faqItemSchema = z.object({
  id: z.string().min(1),
  topic: z.enum(faqTopics),
  question: z.string().min(5),
  answer: z.string().min(10),
});

export type FaqItem = z.infer<typeof faqItemSchema>;

/*
 * Admin form (Phase 4f). Both locales are required. Answers stay plain text: line breaks are kept on
 * the page, and the same text goes into the `FAQPage` JSON-LD.
 */

const F = limits.faq;

const faqTextSchema = z.object({
  question: textField(F.questionMin, F.questionMax),
  answer: textField(F.answerMin, F.answerMax),
});

export const faqFormSchema = z.object({
  topic: z.enum(faqTopics),
  isPublished: z.boolean(),
  texts: z.object({ id: faqTextSchema, en: faqTextSchema }),
});

export const faqUpdateSchema = faqFormSchema.extend({ id: z.uuid() });
export const faqIdSchema = z.object({ id: z.uuid() });
export const faqPublishSchema = faqIdSchema.extend({ isPublished: z.boolean() });

export type FaqTopic = (typeof faqTopics)[number];
export type FaqFormInput = z.input<typeof faqFormSchema>;
export type FaqForm = z.output<typeof faqFormSchema>;
