"use server";

import { cacheTags } from "@/config/cache-tags";
import { getQuotaRules } from "@/features/quota/queries";
import { guardedAction } from "@/features/users/guarded-action";

import { createUnit, deleteUnit, updateUnit } from "./admin-service";
import { unitFormSchema, unitIdSchema, unitUpdateSchema } from "./schema";

/* Unit pages, the finder, the directory and village quota all read units. */
const tags = [cacheTags.units, cacheTags.quota];

/** Adds a unit with the next code of its province; returns its id for the redirect. */
export async function createUnitAction(input: unknown) {
  return guardedAction({
    label: "units",
    schema: unitFormSchema,
    input,
    permission: ["create", "units"],
    tags,
    run: async (form, user) => createUnit(form, await getQuotaRules(), user.id),
  });
}

export async function updateUnitAction(input: unknown) {
  return guardedAction({
    label: "units",
    schema: unitUpdateSchema,
    input,
    permission: ["update", "units"],
    tags,
    run: async ({ id, ...form }, user) => updateUnit(id, form, await getQuotaRules(), user.id),
  });
}

export async function deleteUnitAction(input: unknown) {
  return guardedAction({
    label: "units",
    schema: unitIdSchema,
    input,
    permission: ["delete", "units"],
    tags,
    run: ({ id }, user) => deleteUnit(id, user.id),
  });
}
