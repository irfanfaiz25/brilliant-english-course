import { z } from "zod";

import { regionCodeSchema } from "@/features/regions/schema";

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
