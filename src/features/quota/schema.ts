import { z } from "zod";

import { limits } from "@/config/limits";
import { regionCodeSchema, villageCodeField } from "@/features/regions/schema";
import { integerField } from "@/lib/form-schemas";

export const quotaStatuses = ["available", "almostFull", "full"] as const;
export type QuotaStatus = (typeof quotaStatuses)[number];

/** Slots held by partners who are onboarding in a village (not yet listed as active units). */
export const quotaReservationSchema = z.object({
  villageCode: regionCodeSchema,
  slots: z.number().int().positive(),
});

export type QuotaReservation = z.infer<typeof quotaReservationSchema>;

/** Partnership quota of one village, computed from units and reservations (never typed in). */
export type VillageQuota = {
  villageCode: string;
  max: number;
  activeUnits: number;
  reserved: number;
  remaining: number;
  status: QuotaStatus;
};

/**
 * The `quota` setting (ADR-029): how many units a village may hold, and from how many open
 * slots it is shown as "almost full". Code defaults are `limits.unitsPerVillage` and
 * `limits.quotaAlmostFullAt`.
 */
export const quotaRulesSchema = z
  .object({
    unitsPerVillage: integerField(1, limits.quota.unitsPerVillageMax),
    almostFullAt: integerField(0, limits.quota.unitsPerVillageMax),
  })
  .refine((rules) => rules.almostFullAt < rules.unitsPerVillage, {
    message: "almostFullTooHigh",
    path: ["almostFullAt"],
  });

export type QuotaRules = z.infer<typeof quotaRulesSchema>;
export type QuotaRulesInput = z.input<typeof quotaRulesSchema>;

/** A reservation made in admin: slots held in a village, optionally until a date. */
export const reservationFormSchema = z.object({
  villageCode: villageCodeField,
  slots: integerField(1, limits.quota.reservationSlotsMax),
  note: z
    .string()
    .trim()
    .max(limits.quota.reservationNoteMax, `tooLong:${limits.quota.reservationNoteMax}`),
  /** `YYYY-MM-DD`, or "" to hold the slots until an admin releases them. */
  expiresOn: z.union([z.literal(""), z.iso.date("dateInvalid")]),
});

export type ReservationFormInput = z.input<typeof reservationFormSchema>;
export type ReservationForm = z.output<typeof reservationFormSchema>;

export const reservationIdSchema = z.object({ id: z.uuid() });
