import { z } from "zod";

/** Who is writing; picks the greeting and tells the admin how to route the chat. */
export const contactTopics = ["parent", "partner", "other"] as const;
export type ContactTopic = (typeof contactTopics)[number];

export const contactMessageLimits = { nameMax: 80, messageMin: 10, messageMax: 500 } as const;

/**
 * The WhatsApp message composer on Kontak. Nothing is sent to our server: the validated text
 * opens in WhatsApp. Messages are codes (`ContactForm.errors.<code>`), translated by the form.
 */
export const contactMessageSchema = z.object({
  topic: z.enum(contactTopics, "topicRequired"),
  name: z.string().trim().min(2, "nameRequired").max(contactMessageLimits.nameMax, "nameTooLong"),
  message: z
    .string()
    .trim()
    .min(contactMessageLimits.messageMin, "messageTooShort")
    .max(contactMessageLimits.messageMax, "messageTooLong"),
});

export type ContactMessage = z.infer<typeof contactMessageSchema>;
export type ContactMessageInput = z.input<typeof contactMessageSchema>;
