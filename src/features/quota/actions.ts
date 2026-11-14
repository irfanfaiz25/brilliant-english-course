"use server";

import { cacheTags } from "@/config/cache-tags";
import { saveSetting } from "@/features/settings/service";
import { guardedAction } from "@/features/users/guarded-action";

import { getQuotaRules } from "./queries";
import { quotaRulesSchema, reservationFormSchema, reservationIdSchema } from "./schema";
import { createReservation, releaseReservation } from "./service";

/** The per-village maximum and the "almost full" threshold (the quota checker and Kemitraan). */
export async function updateQuotaRulesAction(input: unknown) {
  return guardedAction({
    label: "quota",
    schema: quotaRulesSchema,
    input,
    permission: ["update", "quota"],
    tags: [cacheTags.settings, cacheTags.quota],
    run: (rules, user) => saveSetting("quota", rules, user.id),
  });
}

/** Holds slots in a village for an onboarding partner. */
export async function createReservationAction(input: unknown) {
  return guardedAction({
    label: "quota",
    schema: reservationFormSchema,
    input,
    permission: ["create", "quota"],
    tags: [cacheTags.quota],
    run: async (form, user) => createReservation(form, await getQuotaRules(), user.id),
  });
}

/** Gives the reserved slots back to the village. */
export async function releaseReservationAction(input: unknown) {
  return guardedAction({
    label: "quota",
    schema: reservationIdSchema,
    input,
    permission: ["delete", "quota"],
    tags: [cacheTags.quota],
    run: ({ id }, user) => releaseReservation(id, user.id),
  });
}
