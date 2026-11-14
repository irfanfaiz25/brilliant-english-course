"use server";

import { cacheTags } from "@/config/cache-tags";
import { guardedAction } from "@/features/users/guarded-action";

import { createPost, deletePost, updatePost } from "./admin-service";
import { postFormSchema, postIdSchema, postUpdateSchema } from "./schema";

/* The blog index, posts, the home page's latest posts and media usage read posts. */
const tags = [cacheTags.blog];

/** Saves a new post; returns its id so the editor can open it. */
export async function createPostAction(input: unknown) {
  return guardedAction({
    label: "blog",
    schema: postFormSchema,
    input,
    permission: ["create", "blog"],
    tags,
    run: (form, user) => createPost(form, user),
  });
}

export async function updatePostAction(input: unknown) {
  return guardedAction({
    label: "blog",
    schema: postUpdateSchema,
    input,
    permission: ["update", "blog"],
    tags,
    run: ({ id, ...form }, user) => updatePost(id, form, user),
  });
}

export async function deletePostAction(input: unknown) {
  return guardedAction({
    label: "blog",
    schema: postIdSchema,
    input,
    permission: ["delete", "blog"],
    tags,
    run: ({ id }, user) => deletePost(id, user),
  });
}
