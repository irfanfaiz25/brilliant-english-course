import { z } from "zod";

import { regionLevels } from "@/config/enums";

/** Kemendagri code format, shared with the `regions` table check constraint. */
export const REGION_CODE_PATTERN = /^\d{2}(\.\d{2}(\.\d{2}(\.\d{4})?)?)?$/;

/**
 * Kemendagri region code: "32" (province) · "32.01" (regency/city) · "32.01.01" (district) ·
 * "32.01.01.2001" (village/kelurahan). The code itself encodes the hierarchy.
 */
export const regionCodeSchema = z.string().regex(REGION_CODE_PATTERN);

/** A village-level code ("32.01.05.2001") picked in an admin form; the message is a form code. */
export const villageCodeField = z
  .string("villageRequired")
  .regex(/^\d{2}\.\d{2}\.\d{2}\.\d{4}$/, "villageRequired");

export { regionLevels };
export type RegionLevel = (typeof regionLevels)[number];

export const regionSchema = z.object({
  code: regionCodeSchema,
  name: z.string().min(1),
});

export type Region = z.infer<typeof regionSchema>;
