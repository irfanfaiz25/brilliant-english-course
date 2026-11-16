import { z } from "zod";

import { regionLevels } from "@/config/enums";
import { limits } from "@/config/limits";
import type { QuotaStatus } from "@/features/quota/schema";

import { parseRegionQuery } from "./search-terms";

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

/**
 * Query of the region search (`/api/regions/search`): the typed text, the levels to look in and
 * whether village results carry their partnership quota.
 */
export const regionSearchParamsSchema = z.object({
  /** The typed text as search terms: "sanggrahan, pelem" → ["sanggrahan", "pelem"]. */
  q: z
    .string()
    .max(limits.regionSearch.maxChars)
    .transform(parseRegionQuery)
    .pipe(z.array(z.string()).min(1)),
  levels: z
    .string()
    .default("village")
    .transform((value) => [...new Set(value.split(","))].sort())
    .pipe(z.array(z.enum(regionLevels)).min(1)),
  quota: z.stringbool().default(false),
});

export type RegionSearchParams = z.infer<typeof regionSearchParamsSchema>;

/** One search hit: the region and its ancestors as one short line ("Beji, Kota Depok, Jawa Barat"). */
export type RegionSearchResult = Region & {
  level: RegionLevel;
  area: string;
  /** Whether every comma-separated term matched (the name or an ancestor's). */
  matchesAll: boolean;
  /** Villages only, when asked: their partnership quota. */
  quota?: { status: QuotaStatus; remaining: number };
};
