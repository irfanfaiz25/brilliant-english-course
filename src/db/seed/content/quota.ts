import type { QuotaReservation } from "@/features/quota/schema";

/**
 * PLACEHOLDER reservations until the leads pipeline stores onboarding partners (Phase 4c/4d).
 * Together with the unit fixtures this gives one full village (Cibinong), villages with one slot
 * left (e.g. Sukamaju) and fully open ones (e.g. Tengah) to review every quota state.
 */
export const quotaReservationFixtures: QuotaReservation[] = [
  { villageCode: "32.01.01.1006", slots: 1 },
];
