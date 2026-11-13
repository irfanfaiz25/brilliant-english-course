import { z } from "zod";

/**
 * Kemendagri region code: "32" (province) · "32.01" (regency/city) · "32.01.01" (district) ·
 * "32.01.01.2001" (village/kelurahan). The code itself encodes the hierarchy.
 */
export const regionCodeSchema = z.string().regex(/^\d{2}(\.\d{2}(\.\d{2}(\.\d{4})?)?)?$/);

export const regionLevels = ["province", "regency", "district", "village"] as const;
export type RegionLevel = (typeof regionLevels)[number];

export const regionSchema = z.object({
  code: regionCodeSchema,
  name: z.string().min(1),
});

export type Region = z.infer<typeof regionSchema>;
