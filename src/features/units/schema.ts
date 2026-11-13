import { z } from "zod";

/** Network-wide numbers shown on the site; always computed from data, never typed in (AGENTS.md § 4). */
export const networkStatsSchema = z.object({
  activeUnits: z.number().int().nonnegative(),
  cities: z.number().int().nonnegative(),
  students: z.number().int().nonnegative(),
});

export type NetworkStats = z.infer<typeof networkStatsSchema>;
