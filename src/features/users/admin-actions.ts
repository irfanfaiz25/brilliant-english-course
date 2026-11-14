"use server";

import { createUser, createUserAccessLink, setUserActive, updateUser } from "./admin-service";
import { guardedAction } from "./guarded-action";
import { userActiveSchema, userFormSchema, userIdSchema, userUpdateSchema } from "./schema";

/*
 * Users module (Phase 4g): super admins only, through the admin pipeline. Accounts are not cached
 * content, so no cache tags expire.
 */

const tags: readonly string[] = [];

/** Creates an account and returns its id and activation link (shown once, then copied). */
export async function createUserAction(input: unknown) {
  return guardedAction({
    label: "users",
    schema: userFormSchema,
    input,
    permission: ["create", "users"],
    tags,
    run: (form, user) => createUser(form, user.id),
  });
}

export async function updateUserAction(input: unknown) {
  return guardedAction({
    label: "users",
    schema: userUpdateSchema,
    input,
    permission: ["update", "users"],
    tags,
    run: ({ id, ...form }, user) => updateUser(id, form, user.id),
  });
}

export async function setUserActiveAction(input: unknown) {
  return guardedAction({
    label: "users",
    schema: userActiveSchema,
    input,
    permission: ["update", "users"],
    tags,
    run: ({ id, isActive }, user) => setUserActive(id, isActive, user.id),
  });
}

/** A new activation or reset link; earlier links of the account stop working. */
export async function createUserAccessLinkAction(input: unknown) {
  return guardedAction({
    label: "users",
    schema: userIdSchema,
    input,
    permission: ["update", "users"],
    tags,
    run: ({ id }, user) => createUserAccessLink(id, user.id),
  });
}
