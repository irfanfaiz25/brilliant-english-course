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
    skills: z.array(z.string().min(1)).min(1).max(5),
    image: imageSchema,
  })
  .refine((level) => level.ageMin <= level.ageMax, { message: "ageMin must not exceed ageMax" });

export type Level = z.infer<typeof levelSchema>;
