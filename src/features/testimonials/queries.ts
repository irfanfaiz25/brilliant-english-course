import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";
import type { Locale } from "@/i18n/routing";

import { testimonialFixtures } from "./fixtures";
import type { Testimonial } from "./schema";

/** Published testimonials for an audience. Reads fixtures until the database lands (Phase 3). */
export async function getTestimonials(
  locale: Locale,
  audience: Testimonial["audience"],
): Promise<Testimonial[]> {
  "use cache";
  cacheTag(cacheTags.testimonials);
  cacheLife("hours");
  return testimonialFixtures[locale].filter((testimonial) => testimonial.audience === audience);
}
