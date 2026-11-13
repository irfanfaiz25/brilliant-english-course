import { z } from "zod";

import { imageSchema } from "@/lib/schemas";

export const levelSlugs = ["kindy", "intro", "secondary"] as const;
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
