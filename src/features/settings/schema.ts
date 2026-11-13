import { z } from "zod";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

/** Opening hours for a set of ISO weekdays (1 = Monday … 7 = Sunday). */
export const officeHoursSchema = z.object({
  days: z.array(z.number().int().min(1).max(7)).min(1),
  opens: timeSchema,
  closes: timeSchema,
});

/** Head-office contact details, editable in admin settings from Phase 4a (ADR-008). */
export const contactSettingsSchema = z.object({
  whatsapp: z.string().regex(/^62\d{8,13}$/),
  email: z.email(),
  address: z.string().min(5),
  officeHours: z.array(officeHoursSchema).min(1),
  social: z.object({
    instagram: z.url(),
    facebook: z.url(),
    youtube: z.url(),
    tiktok: z.url(),
  }),
});

export type OfficeHours = z.infer<typeof officeHoursSchema>;
export type ContactSettings = z.infer<typeof contactSettingsSchema>;
