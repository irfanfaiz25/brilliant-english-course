import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";
import { db } from "@/db/client";
import { testimonials, testimonialTranslations } from "@/db/schema";
import type { Locale } from "@/i18n/routing";
import { groupTranslations, pickTranslation } from "@/lib/translations";

import type { Testimonial } from "./schema";

/** Published testimonials for an audience, in display order, resolved to `locale`. */
export async function getTestimonials(
  locale: Locale,
  audience: Testimonial["audience"],
): Promise<Testimonial[]> {
  "use cache";
  cacheTag(cacheTags.testimonials);
  cacheLife("hours");

  const rows = await db
    .select()
    .from(testimonials)
    .where(and(eq(testimonials.isPublished, true), eq(testimonials.audience, audience)))
    .orderBy(asc(testimonials.sortOrder));
  const translations = rows.length ? await db.select().from(testimonialTranslations) : [];
  const byTestimonial = groupTranslations(translations, (row) => row.testimonialId);

  return rows.flatMap((row) => {
    const text = pickTranslation(byTestimonial.get(row.id) ?? [], locale);
    if (!text) return [];
    return [
      {
        id: row.id,
        audience: row.audience,
        quote: text.quote,
        author: row.authorName,
        role: text.role,
        rating: row.rating,
      },
    ];
  });
}
