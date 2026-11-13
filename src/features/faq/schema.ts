import { z } from "zod";

export const faqTopics = ["parents", "program", "partners"] as const;

/** One FAQ entry, resolved to one locale. Answers are plain text (also used for FAQPage JSON-LD). */
export const faqItemSchema = z.object({
  id: z.string().min(1),
  topic: z.enum(faqTopics),
  question: z.string().min(5),
  answer: z.string().min(10),
});

export type FaqItem = z.infer<typeof faqItemSchema>;
