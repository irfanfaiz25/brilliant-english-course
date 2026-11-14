"use server";

import { cacheTags } from "@/config/cache-tags";
import { getQuotaRules } from "@/features/quota/queries";
import { guardedAction } from "@/features/users/guarded-action";

import { addLeadNote, deleteLead, updateLead } from "./admin-service";
import { leadIdSchema, leadNoteSchema, leadUpdateSchema } from "./schema";

/*
 * Lead pipeline actions (Phase 4d). Leads are admin-only data, so nothing public is cached for
 * them; the quota tag expires because onboarding leads hold village slots.
 */

/** Status and assignee (and an optional note); `onboarding` reserves a village slot. */
export async function updateLeadAction(input: unknown) {
  return guardedAction({
    label: "leads",
    schema: leadUpdateSchema,
    input,
    permission: ["update", "leads"],
    tags: [cacheTags.quota],
    run: async (form, user) => updateLead(form, await getQuotaRules(), user.id),
  });
}

export async function addLeadNoteAction(input: unknown) {
  return guardedAction({
    label: "leads",
    schema: leadNoteSchema,
    input,
    permission: ["update", "leads"],
    tags: [],
    run: (form, user) => addLeadNote(form, user.id),
  });
}

/** Removes a lead (spam, duplicates); its reserved slot is released. */
export async function deleteLeadAction(input: unknown) {
  return guardedAction({
    label: "leads",
    schema: leadIdSchema,
    input,
    permission: ["delete", "leads"],
    tags: [cacheTags.quota],
    run: ({ id }, user) => deleteLead(id, user.id),
  });
}
