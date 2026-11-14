import { z } from "zod";

import { levelThemes } from "@/config/enums";
import { limits } from "@/config/limits";
import { imageIdField, integerField, rowListField, textField } from "@/lib/form-schemas";
import { imageSchema } from "@/lib/schemas";

export { levelThemes };
export type LevelTheme = (typeof levelThemes)[number];

/** A level's slug: its anchor on the Program page (`/program#<slug>`) and its admin URL. */
export const levelSlugSchema = z
  .string()
  .min(1)
  .max(limits.programs.slugMax)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

/** A program level as shown on the public site (already resolved to one locale). */
export const levelSchema = z
  .object({
    slug: levelSlugSchema,
    theme: z.enum(levelThemes),
    /** Listed by the hero age chips (special programs may stay out and overlap other ages). */
    inAgeFinder: z.boolean(),
    name: z.string().min(1),
    ageMin: z.number().int().min(3),
    ageMax: z.number().int().max(18),
    tagline: z.string().min(1),
    summary: z.string().min(1),
    /** Short highlights for cards (Home). */
    skills: z.array(z.string().min(1)).min(1).max(5),
    /** Longer description for the Program page. */
    description: z.string().min(1),
    /** "What children learn" list for the Program page. */
    curriculum: z.array(z.string().min(1)).min(1).max(8),
    sessionsPerWeek: z.number().int().positive(),
    maxStudentsPerClass: z.number().int().positive(),
    image: imageSchema,
  })
  .refine((level) => level.ageMin <= level.ageMax, { message: "ageMin must not exceed ageMax" });

export type Level = z.infer<typeof levelSchema>;

/** What a level badge needs (unit cards and lists name the levels a unit offers). */
export type LevelBadge = Pick<Level, "slug" | "name" | "theme">;

/*
 * Admin form (Phase 4b, open-ended since ADR-038). The slug is derived once from the Indonesian
 * name when a level is added and never changes; the theme comes from a fixed palette. Both
 * locales are required: the copy is short and the site is fully bilingual. Messages are codes
 * (`lib/form-schemas`).
 */

const L = limits.programs;

const levelTextSchema = z.object({
  name: textField(1, L.nameMax),
  tagline: textField(3, L.taglineMax),
  summary: textField(20, L.summaryMax),
  skills: rowListField(textField(2, L.skillMax), 1, L.skillsMax),
  description: textField(40, L.descriptionMax),
  curriculum: rowListField(textField(2, L.curriculumItemMax), 1, L.curriculumMax),
  imageAlt: textField(3, limits.imageAltMax),
});

const levelFields = z.object({
  theme: z.enum(levelThemes),
  inAgeFinder: z.boolean(),
  ageMin: integerField(L.ageMin, L.ageMax),
  ageMax: integerField(L.ageMin, L.ageMax),
  sessionsPerWeek: integerField(1, L.sessionsPerWeekMax),
  maxStudentsPerClass: integerField(1, L.studentsPerClassMax),
  imageId: imageIdField,
  isPublished: z.boolean(),
  texts: z.object({ id: levelTextSchema, en: levelTextSchema }),
});

const validAgeRange = (level: { ageMin: number; ageMax: number }) => level.ageMin <= level.ageMax;
const ageRangeError = { message: "ageRange", path: ["ageMax"] };

/** Adding a level (no slug yet: the service derives it from the name). */
export const levelFormSchema = levelFields.refine(validAgeRange, ageRangeError);

/** Saving an existing level. */
export const levelUpdateSchema = levelFields
  .extend({ id: z.uuid() })
  .refine(validAgeRange, ageRangeError);

export type LevelFormInput = z.input<typeof levelFormSchema>;
export type LevelForm = z.output<typeof levelFormSchema>;
export type LevelText = z.output<typeof levelTextSchema>;

export const levelKeySchema = z.object({ id: z.uuid() });
export const levelPublishSchema = levelKeySchema.extend({ isPublished: z.boolean() });
