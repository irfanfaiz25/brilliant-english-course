"use server";

import { cacheTags } from "@/config/cache-tags";
import { guardedAction } from "@/features/users/guarded-action";
import { reorderSchema } from "@/lib/ordering";
import { can } from "@/lib/permissions";

import {
  activityFormSchema,
  activityIdSchema,
  activityPublishSchema,
  activityUpdateSchema,
} from "./schema";
import {
  createActivity,
  deleteActivity,
  reorderActivities,
  setActivityPublished,
  updateActivity,
} from "./service";

const tags = [cacheTags.activities];

/** Adds an activity at the end of the list; returns its id for the redirect to its edit page. */
export async function createActivityAction(input: unknown) {
  return guardedAction({
    label: "activities",
    schema: activityFormSchema,
    input,
    permission: ["create", "activities"],
    tags,
    run: (form, user) =>
      createActivity(form, { actorId: user.id, canPublish: can(user, "publish", "activities") }),
  });
}

export async function updateActivityAction(input: unknown) {
  return guardedAction({
    label: "activities",
    schema: activityUpdateSchema,
    input,
    permission: ["update", "activities"],
    tags,
    run: ({ id, ...form }, user) =>
      updateActivity(id, form, {
        actorId: user.id,
        canPublish: can(user, "publish", "activities"),
      }),
  });
}

export async function deleteActivityAction(input: unknown) {
  return guardedAction({
    label: "activities",
    schema: activityIdSchema,
    input,
    permission: ["delete", "activities"],
    tags,
    run: ({ id }, user) => deleteActivity(id, user.id),
  });
}

export async function setActivityPublishedAction(input: unknown) {
  return guardedAction({
    label: "activities",
    schema: activityPublishSchema,
    input,
    permission: ["publish", "activities"],
    tags,
    run: ({ id, isPublished }, user) => setActivityPublished(id, isPublished, user.id),
  });
}

export async function reorderActivitiesAction(input: unknown) {
  return guardedAction({
    label: "activities",
    schema: reorderSchema,
    input,
    permission: ["update", "activities"],
    tags,
    run: ({ ids, moved }, user) => reorderActivities(ids, moved, user.id),
  });
}
