import { z } from "zod";

import { limits } from "@/config/limits";
import { timeField, weekdaysField, whatsappField } from "@/lib/form-schemas";

/*
 * Setting schemas validate both the stored JSON (public reads) and the admin forms. Messages are
 * stable codes translated by the forms (`AdminSettings.errors.<code>`).
 */

/** Opening hours for a set of ISO weekdays (1 = Monday … 7 = Sunday). */
export const officeHoursSchema = z
  .object({
    days: weekdaysField,
    opens: timeField,
    closes: timeField,
  })
  .refine((entry) => entry.closes > entry.opens, {
    message: "closesBeforeOpens",
    path: ["closes"],
  });

const socialUrlSchema = z.url({ protocol: /^https$/, message: "urlInvalid" });

/** Head-office contact details, edited in admin settings (ADR-008). */
export const contactSettingsSchema = z.object({
  whatsapp: whatsappField,
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
