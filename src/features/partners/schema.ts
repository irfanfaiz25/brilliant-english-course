import { z } from "zod";

import { leadStatuses, partnerBackgrounds, partnerSpaceOptions } from "@/config/enums";
import { limits } from "@/config/limits";
import { regionCodeSchema } from "@/features/regions/schema";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";

/** Pipeline stages of a lead in admin (Phase 4d). */
export { leadStatuses };
export type LeadStatus = (typeof leadStatuses)[number];

/** What the applicant does today; helps admins prioritise follow-ups. */
export { partnerBackgrounds };
export type PartnerBackground = (typeof partnerBackgrounds)[number];

/** Whether the applicant has a room to teach in (a living room is enough). */
export { partnerSpaceOptions };
export type PartnerSpace = (typeof partnerSpaceOptions)[number];

/** Indonesian mobile number once normalized to international digits (62 8xx…). */
const INDONESIAN_MOBILE = /^628\d{7,11}$/;

/**
 * Validation messages are stable codes (`PartnerForm.errors.<code>`), translated by the form, so
 * one schema serves the browser (React Hook Form) and the Server Action.
 */
export const partnerApplicantSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "nameRequired")
    .max(limits.partnerApplication.nameMax, "nameTooLong"),
  whatsapp: z
    .string()
    .trim()
    .min(1, "whatsappRequired")
    .refine((value) => INDONESIAN_MOBILE.test(normalizeWhatsAppNumber(value)), "whatsappInvalid"),
  email: z.union([z.literal(""), z.email("emailInvalid")]),
  background: z.enum(partnerBackgrounds, "backgroundRequired"),
  space: z.enum(partnerSpaceOptions, "spaceRequired"),
  motivation: z.string().trim().max(limits.partnerApplication.motivationMax, "motivationTooLong"),
  consent: z.boolean().refine(Boolean, "consentRequired"),
});

/** The full application: the applicant's answers plus the village chosen in the quota checker. */
export const partnerApplicationSchema = partnerApplicantSchema.extend({
  villageCode: regionCodeSchema.refine((code) => code.split(".").length === 4, "villageRequired"),
});

export type PartnerApplicantInput = z.input<typeof partnerApplicantSchema>;
export type PartnerApplication = z.infer<typeof partnerApplicationSchema>;

/** Field order of the two form steps; also used to jump to the first invalid step. */
export const partnerFormSteps = [
  ["fullName", "whatsapp", "email"],
  ["background", "space", "motivation", "consent"],
] as const satisfies readonly (readonly (keyof PartnerApplicantInput)[])[];

export const partnerApplicationErrors = [
  "invalid",
  "villageRequired",
  "quotaFull",
  "rateLimited",
  "unknown",
] as const;
export type PartnerApplicationError = (typeof partnerApplicationErrors)[number];

/** Partnership package shown on Kemitraan (admin-editable from Phase 4a, ADR-008). */
export const partnershipPackageSchema = z.object({
  /** Starting investment in IDR; `null` keeps it for the consultation. */
  investment: z.number().int().positive().nullable(),
  inclusions: z.array(z.string().min(3)).min(3),
});

export type PartnershipPackage = z.infer<typeof partnershipPackageSchema>;
