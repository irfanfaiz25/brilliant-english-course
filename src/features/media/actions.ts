"use server";

import { guardedAction } from "@/features/users/guarded-action";

import { deleteMedia, finishUpload, renameMedia, startUpload } from "./admin-service";
import { mediaIdSchema, mediaRenameSchema, uploadFinishSchema, uploadStartSchema } from "./schema";

/*
 * Media changes no public page by themselves: an image shows on the site only once content picks
 * it, and an image in use cannot be deleted. So no cache tags expire here.
 */
const tags: readonly string[] = [];

/** Step 1 of an upload: where the browser should PUT the file (see `startUpload`). */
export async function startUploadAction(input: unknown) {
  return guardedAction({
    label: "media",
    schema: uploadStartSchema,
    input,
    permission: ["create", "media"],
    tags,
    run: (file) => startUpload(file),
  });
}

/** Step 2: process the uploaded file and add it to the library. */
export async function finishUploadAction(input: unknown) {
  return guardedAction({
    label: "media",
    schema: uploadFinishSchema,
    input,
    permission: ["create", "media"],
    tags,
    run: (upload, user) => finishUpload(upload, user.id),
  });
}

export async function renameMediaAction(input: unknown) {
  return guardedAction({
    label: "media",
    schema: mediaRenameSchema,
    input,
    permission: ["update", "media"],
    tags,
    run: (data, user) => renameMedia(data, user.id),
  });
}

export async function deleteMediaAction(input: unknown) {
  return guardedAction({
    label: "media",
    schema: mediaIdSchema,
    input,
    permission: ["delete", "media"],
    tags,
    run: ({ id }, user) => deleteMedia(id, user.id),
  });
}
