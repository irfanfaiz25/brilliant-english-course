import "server-only";

import { asc, count, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { testimonials, testimonialTranslations } from "@/db/schema";
import type { SessionUser } from "@/features/users/schema";
import type { Locale } from "@/i18n/routing";
import { assertCan } from "@/lib/permissions";
import { groupTranslations, pickTranslation } from "@/lib/translations";

import {
  testimonialAudiences,
  type TestimonialAudience,
  type TestimonialFormInput,
} from "./schema";

/*
 * Admin reads of testimonials: published or not, uncached and permission-checked (data access
 * layer, ADR-025).
 */

export type AdminTestimonial = {
  id: string;
  authorName: string;
  quote: string;
  role: string;
  rating: number;
  isPublished: boolean;
};

export type AdminTestimonialList = {
  items: AdminTestimonial[];
  /** Testimonials per audience, for the filter chips. */
  counts: Record<TestimonialAudience, number>;
};

/** One audience's testimonials in display order, worded in `locale` (falling back to Indonesian). */
export async function getAdminTestimonials(
  actor: SessionUser,
  locale: Locale,
  audience: TestimonialAudience,
): Promise<AdminTestimonialList> {
  assertCan(actor, "read", "testimonials");
  const [rows, totals] = await Promise.all([
    db
      .select()
      .from(testimonials)
      .where(eq(testimonials.audience, audience))
      .orderBy(asc(testimonials.sortOrder), asc(testimonials.createdAt)),
    db
      .select({ audience: testimonials.audience, total: count() })
      .from(testimonials)
      .groupBy(testimonials.audience),
  ]);
  const translations = rows.length ? await db.select().from(testimonialTranslations) : [];
  const byTestimonial = groupTranslations(translations, (row) => row.testimonialId);
  const counts = Object.fromEntries(
    testimonialAudiences.map((key) => [
      key,
      totals.find((row) => row.audience === key)?.total ?? 0,
    ]),
  ) as Record<TestimonialAudience, number>;

  return {
    counts,
    items: rows.map((row) => {
      const text = pickTranslation(byTestimonial.get(row.id) ?? [], locale);
      return {
        id: row.id,
        authorName: row.authorName,
        quote: text?.quote ?? "",
        role: text?.role ?? "",
        rating: row.rating,
        isPublished: row.isPublished,
      };
    }),
  };
}

export type TestimonialForEdit = { values: TestimonialFormInput; updatedAt: Date };

/** One testimonial as form values, or `null` when it does not exist. */
export async function getTestimonialForEdit(
  actor: SessionUser,
  id: string,
): Promise<TestimonialForEdit | null> {
  assertCan(actor, "read", "testimonials");
  const [row] = await db.select().from(testimonials).where(eq(testimonials.id, id));
  if (!row) return null;
  const translations = await db
    .select()
    .from(testimonialTranslations)
    .where(eq(testimonialTranslations.testimonialId, id));
  const textFor = (locale: Locale) => {
    const text = translations.find((translation) => translation.locale === locale);
    return { quote: text?.quote ?? "", role: text?.role ?? "" };
  };
  return {
    values: {
      audience: row.audience,
      authorName: row.authorName,
      rating: row.rating,
      isPublished: row.isPublished,
      texts: { id: textFor("id"), en: textFor("en") },
    },
    updatedAt: row.updatedAt,
  };
}
