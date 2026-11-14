"use server";

import { cacheTags } from "@/config/cache-tags";
import { guardedAction } from "@/features/users/guarded-action";
import { moveSchema } from "@/lib/ordering";
import { can } from "@/lib/permissions";

import {
  createFaqItem,
  deleteFaqItem,
  moveFaqItem,
  setFaqItemPublished,
  updateFaqItem,
} from "./admin-service";
import { faqFormSchema, faqIdSchema, faqPublishSchema, faqUpdateSchema } from "./schema";

const tags = [cacheTags.faq];

/** Adds an FAQ entry at the end of its topic's list. */
export async function createFaqItemAction(input: unknown) {
  return guardedAction({
    label: "faq",
    schema: faqFormSchema,
    input,
    permission: ["create", "faq"],
    tags,
    run: (form, user) =>
      createFaqItem(form, {
        actorId: user.id,
        canPublish: can(user, "publish", "faq"),
      }),
  });
}

export async function updateFaqItemAction(input: unknown) {
  return guardedAction({
    label: "faq",
    schema: faqUpdateSchema,
    input,
    permission: ["update", "faq"],
    tags,
    run: ({ id, ...form }, user) =>
      updateFaqItem(id, form, {
        actorId: user.id,
        canPublish: can(user, "publish", "faq"),
      }),
  });
}

export async function deleteFaqItemAction(input: unknown) {
  return guardedAction({
    label: "faq",
    schema: faqIdSchema,
    input,
    permission: ["delete", "faq"],
    tags,
    run: ({ id }, user) => deleteFaqItem(id, user.id),
  });
}

export async function setFaqItemPublishedAction(input: unknown) {
  return guardedAction({
    label: "faq",
    schema: faqPublishSchema,
    input,
    permission: ["publish", "faq"],
    tags,
    run: ({ id, isPublished }, user) => setFaqItemPublished(id, isPublished, user.id),
  });
}

export async function moveFaqItemAction(input: unknown) {
  return guardedAction({
    label: "faq",
    schema: moveSchema,
    input,
    permission: ["update", "faq"],
    tags,
    run: ({ id, direction }, user) => moveFaqItem(id, direction, user.id),
  });
}
