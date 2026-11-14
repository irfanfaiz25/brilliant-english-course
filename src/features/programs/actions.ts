"use server";

import { cacheTags } from "@/config/cache-tags";
import { guardedAction } from "@/features/users/guarded-action";
import { reorderSchema } from "@/lib/ordering";
import { can } from "@/lib/permissions";

import { levelFormSchema, levelKeySchema, levelPublishSchema, levelUpdateSchema } from "./schema";
import { createLevel, deleteLevel, reorderLevels, setLevelPublished, updateLevel } from "./service";

/*
 * Levels feed Home, Program, the hero age finder and the unit cards and pages (which name the
 * levels a unit offers), so every change expires both tags.
 */
const tags = [cacheTags.programs, cacheTags.units];

/** Adds a level at the end of the list; returns its id and slug for the redirect. */
export async function createLevelAction(input: unknown) {
  return guardedAction({
    label: "programs",
    schema: levelFormSchema,
    input,
    permission: ["create", "programs"],
    tags,
    run: (form, user) =>
      createLevel(form, { actorId: user.id, canPublish: can(user, "publish", "programs") }),
  });
}

/** Saves a level's numbers, theme, photo and copy. */
export async function updateLevelAction(input: unknown) {
  return guardedAction({
    label: "programs",
    schema: levelUpdateSchema,
    input,
    permission: ["update", "programs"],
    tags,
    run: ({ id, ...form }, user) =>
      updateLevel(id, form, { actorId: user.id, canPublish: can(user, "publish", "programs") }),
  });
}

/** Deletes a level no unit offers. */
export async function deleteLevelAction(input: unknown) {
  return guardedAction({
    label: "programs",
    schema: levelKeySchema,
    input,
    permission: ["delete", "programs"],
    tags,
    run: ({ id }, user) => deleteLevel(id, user.id),
  });
}

/** Shows or hides a level on the public site. */
export async function setLevelPublishedAction(input: unknown) {
  return guardedAction({
    label: "programs",
    schema: levelPublishSchema,
    input,
    permission: ["publish", "programs"],
    tags,
    run: ({ id, isPublished }, user) => setLevelPublished(id, isPublished, user.id),
  });
}

export async function reorderLevelsAction(input: unknown) {
  return guardedAction({
    label: "programs",
    schema: reorderSchema,
    input,
    permission: ["update", "programs"],
    tags,
    run: ({ ids, moved }, user) => reorderLevels(ids, moved, user.id),
  });
}
