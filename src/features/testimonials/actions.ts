"use server";

import { cacheTags } from "@/config/cache-tags";
import { guardedAction } from "@/features/users/guarded-action";
import { reorderSchema } from "@/lib/ordering";
import { can } from "@/lib/permissions";

import {
  createTestimonial,
  deleteTestimonial,
  reorderTestimonials,
  setTestimonialPublished,
  updateTestimonial,
} from "./admin-service";
import {
  testimonialFormSchema,
  testimonialIdSchema,
  testimonialPublishSchema,
  testimonialUpdateSchema,
} from "./schema";

const tags = [cacheTags.testimonials];

/** Adds a testimonial at the end of its audience's list. */
export async function createTestimonialAction(input: unknown) {
  return guardedAction({
    label: "testimonials",
    schema: testimonialFormSchema,
    input,
    permission: ["create", "testimonials"],
    tags,
    run: (form, user) =>
      createTestimonial(form, {
        actorId: user.id,
        canPublish: can(user, "publish", "testimonials"),
      }),
  });
}

export async function updateTestimonialAction(input: unknown) {
  return guardedAction({
    label: "testimonials",
    schema: testimonialUpdateSchema,
    input,
    permission: ["update", "testimonials"],
    tags,
    run: ({ id, ...form }, user) =>
      updateTestimonial(id, form, {
        actorId: user.id,
        canPublish: can(user, "publish", "testimonials"),
      }),
  });
}

export async function deleteTestimonialAction(input: unknown) {
  return guardedAction({
    label: "testimonials",
    schema: testimonialIdSchema,
    input,
    permission: ["delete", "testimonials"],
    tags,
    run: ({ id }, user) => deleteTestimonial(id, user.id),
  });
}

export async function setTestimonialPublishedAction(input: unknown) {
  return guardedAction({
    label: "testimonials",
    schema: testimonialPublishSchema,
    input,
    permission: ["publish", "testimonials"],
    tags,
    run: ({ id, isPublished }, user) => setTestimonialPublished(id, isPublished, user.id),
  });
}

export async function reorderTestimonialsAction(input: unknown) {
  return guardedAction({
    label: "testimonials",
    schema: reorderSchema,
    input,
    permission: ["update", "testimonials"],
    tags,
    run: ({ ids, moved }, user) => reorderTestimonials(ids, moved, user.id),
  });
}
