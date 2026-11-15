"use server";

import type { z } from "zod";

import { cacheTags } from "@/config/cache-tags";
import type { SettingKey } from "@/features/settings/keys";
import { saveSetting } from "@/features/settings/service";
import { guardedAction } from "@/features/users/guarded-action";

import {
  partnershipBenefitsSchema,
  partnershipKitSchema,
  partnershipStepsSchema,
  partnershipTrainingSchema,
} from "./page-schema";

/*
 * Saving the Kemitraan page sections (ADR-041). Each section is one setting, saved by its own
 * panel; site settings, so they need `update` on `settings`.
 */

function saveSection<T>(key: SettingKey, schema: z.ZodType<T, unknown>, input: unknown) {
  return guardedAction({
    label: "settings",
    schema,
    input,
    permission: ["update", "settings"],
    tags: [cacheTags.settings],
    run: (value, user) => saveSetting(key, value, user.id),
  });
}

export async function updatePartnershipBenefits(input: unknown) {
  return saveSection("partnershipBenefits", partnershipBenefitsSchema, input);
}

/** Starter kit and the starting investment (the `partnership` setting). */
export async function updatePartnershipKit(input: unknown) {
  return saveSection("partnership", partnershipKitSchema, input);
}

export async function updatePartnershipTraining(input: unknown) {
  return saveSection("partnershipTraining", partnershipTrainingSchema, input);
}

export async function updatePartnershipSteps(input: unknown) {
  return saveSection("partnershipSteps", partnershipStepsSchema, input);
}
