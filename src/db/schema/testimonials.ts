import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { testimonialAudiences } from "../../config/enums";
import { id, localeEnum, timestamps } from "./_helpers";
import { units } from "./units";

export const testimonialAudienceEnum = pgEnum("testimonial_audience", testimonialAudiences);

export const testimonials = pgTable(
  "testimonials",
  {
    id: id(),
    audience: testimonialAudienceEnum().notNull(),
    authorName: varchar({ length: 120 }).notNull(),
    rating: smallint().notNull(),
    /** Optional link to the unit the author belongs to. */
    unitId: uuid().references(() => units.id, { onDelete: "set null" }),
    sortOrder: smallint().notNull().default(0),
    isPublished: boolean().notNull().default(false),
    ...timestamps,
  },
  (table) => [check("testimonials_rating_range", sql`${table.rating} between 1 and 5`)],
);

export const testimonialTranslations = pgTable(
  "testimonial_translations",
  {
    testimonialId: uuid()
      .notNull()
      .references(() => testimonials.id, { onDelete: "cascade" }),
    locale: localeEnum().notNull(),
    quote: text().notNull(),
    /** Context line, e.g. "Orang tua siswa Kindy · Kab. Bogor". */
    role: varchar({ length: 120 }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.testimonialId, table.locale] })],
);

export type TestimonialRow = typeof testimonials.$inferSelect;
