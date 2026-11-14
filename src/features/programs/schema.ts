import { z } from "zod";

import { levelSlugs } from "@/config/enums";
import { limits } from "@/config/limits";
import { imageIdField, integerField, rowListField, textField } from "@/lib/form-schemas";
import { imageSchema } from "@/lib/schemas";

export { levelSlugs };
export type LevelSlug = (typeof levelSlugs)[number];

/** A program level as shown on the public site (already resolved to one locale). */
export const levelSchema = z
  .object({
    slug: z.enum(levelSlugs),
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

/*
 * Admin form (Phase 4b). Levels are fixed (`levelSlugs` drive URLs and colors), so admins edit a
 * level's numbers, photo and copy but cannot add or remove one. Both locales are required: the
 * copy is short and the site is fully bilingual. Messages are codes (`lib/form-schemas`).
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

export const levelFormSchema = z
  .object({
    slug: z.enum(levelSlugs),
    ageMin: integerField(L.ageMin, L.ageMax),
    ageMax: integerField(L.ageMin, L.ageMax),
    sessionsPerWeek: integerField(1, L.sessionsPerWeekMax),
    maxStudentsPerClass: integerField(1, L.studentsPerClassMax),
    imageId: imageIdField,
    isPublished: z.boolean(),
    texts: z.object({ id: levelTextSchema, en: levelTextSchema }),
  })
  .refine((level) => level.ageMin <= level.ageMax, { message: "ageRange", path: ["ageMax"] });

export type LevelFormInput = z.input<typeof levelFormSchema>;
export type LevelForm = z.output<typeof levelFormSchema>;
export type LevelText = z.output<typeof levelTextSchema>;

export const levelPublishSchema = z.object({ slug: z.enum(levelSlugs), isPublished: z.boolean() });
