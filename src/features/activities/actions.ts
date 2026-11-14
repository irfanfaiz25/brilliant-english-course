"use server";

import { cacheTags } from "@/config/cache-tags";
import { guardedAction } from "@/features/users/guarded-action";
import { can } from "@/lib/permissions";

import {
  activityFormSchema,
  activityIdSchema,
  activityMoveSchema,
  activityPublishSchema,
  activityUpdateSchema,
} from "./schema";
import {
  createActivity,
  deleteActivity,
  moveActivity,
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

export async function moveActivityAction(input: unknown) {
  return guardedAction({
    label: "activities",
    schema: activityMoveSchema,
    input,
    permission: ["update", "activities"],
    tags,
    run: ({ id, direction }, user) => moveActivity(id, direction, user.id),
  });
}
