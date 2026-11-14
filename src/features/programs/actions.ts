"use server";

import { cacheTags } from "@/config/cache-tags";
import { guardedAction } from "@/features/users/guarded-action";
import { can } from "@/lib/permissions";

import { levelFormSchema, levelPublishSchema } from "./schema";
import { setLevelPublished, updateLevel } from "./service";

/** Saves a level's numbers, photo and copy (Home, Program and the hero age finder read them). */
export async function updateLevelAction(input: unknown) {
  return guardedAction({
    label: "programs",
    schema: levelFormSchema,
    input,
    permission: ["update", "programs"],
    tags: [cacheTags.programs],
    run: (form, user) =>
      updateLevel(form, { actorId: user.id, canPublish: can(user, "publish", "programs") }),
  });
}

/** Shows or hides a level on the public site. */
export async function setLevelPublishedAction(input: unknown) {
  return guardedAction({
    label: "programs",
    schema: levelPublishSchema,
    input,
    permission: ["publish", "programs"],
    tags: [cacheTags.programs],
    run: ({ slug, isPublished }, user) => setLevelPublished(slug, isPublished, user.id),
  });
}
