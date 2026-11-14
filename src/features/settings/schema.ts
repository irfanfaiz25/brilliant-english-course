import { z } from "zod";

import { limits } from "@/config/limits";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";

/*
 * Setting schemas validate both the stored JSON (public reads) and the admin forms. Messages are
 * stable codes translated by the forms (`AdminSettings.errors.<code>`).
 */

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "timeInvalid");

/** Opening hours for a set of ISO weekdays (1 = Monday … 7 = Sunday). */
export const officeHoursSchema = z
  .object({
    days: z.array(z.number().int().min(1).max(7)).min(1, "daysRequired"),
    opens: timeSchema,
    closes: timeSchema,
  })
  // "HH:MM" strings compare correctly as text.
  .refine((entry) => entry.closes > entry.opens, { message: "closesBeforeOpens", path: ["closes"] })
  .refine((entry) => new Set(entry.days).size === entry.days.length, {
    message: "daysRequired",
    path: ["days"],
  });

const socialUrlSchema = z.url({ protocol: /^https$/, message: "urlInvalid" });

/** Head-office contact details, edited in admin settings (ADR-008). */
export const contactSettingsSchema = z.object({
  // Admins may type "0812…" or "+62 812…"; it is stored as "62812…" like WhatsApp expects.
  whatsapp: z
    .string()
    .trim()
    .transform(normalizeWhatsAppNumber)
    .pipe(z.string().regex(/^628\d{7,11}$/, "whatsappInvalid")),
  email: z.string().trim().toLowerCase().pipe(z.email("emailInvalid")),
  address: z
    .string()
    .trim()
    .min(5, "addressRequired")
    .max(limits.settings.addressMax, "addressTooLong"),
  officeHours: z
    .array(officeHoursSchema)
    .min(1, "officeHoursRequired")
    .max(limits.settings.officeHoursMax)
    .refine((rows) => {
      const days = rows.flatMap((row) => row.days);
      return new Set(days).size === days.length;
    }, "daysOverlap"),
  social: z.object({
    instagram: socialUrlSchema,
    facebook: socialUrlSchema,
    youtube: socialUrlSchema,
    tiktok: socialUrlSchema,
  }),
});

export type OfficeHours = z.infer<typeof officeHoursSchema>;
export type ContactSettings = z.infer<typeof contactSettingsSchema>;
export type ContactSettingsInput = z.input<typeof contactSettingsSchema>;
