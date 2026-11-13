import { z } from "zod";

import { levelSlugs } from "@/features/programs/schema";
import { regionCodeSchema } from "@/features/regions/schema";

/** Network-wide numbers shown on the site; always computed from data, never typed in (AGENTS.md § 4). */
export const networkStatsSchema = z.object({
  activeUnits: z.number().int().nonnegative(),
  cities: z.number().int().nonnegative(),
  students: z.number().int().nonnegative(),
});

export type NetworkStats = z.infer<typeof networkStatsSchema>;

/** Whether a unit is taking new students. */
export const enrollmentStatuses = ["open", "limited", "full"] as const;
export type EnrollmentStatus = (typeof enrollmentStatuses)[number];

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

/** What the public site needs to show a unit card. */
export const unitSummarySchema = z.object({
  code: z.string().regex(/^BEC-[A-Z]{2}-\d{4}$/),
  name: z.string().min(1),
  address: z.string().min(1),
  district: z.string().min(1),
  regency: z.string().min(1),
  /** Kemendagri village code; the region filter matches any ancestor of it. */
  villageCode: regionCodeSchema,
  location: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
  manager: z.string().min(1),
  whatsapp: z.string().min(8),
  /** ISO weekdays the unit is open (1 = Monday … 7 = Sunday). */
  openDays: z.array(z.number().int().min(1).max(7)).min(1),
  opensAt: timeSchema,
  closesAt: timeSchema,
  levels: z.array(z.enum(levelSlugs)).min(1),
  enrollment: z.enum(enrollmentStatuses),
});

export type UnitSummary = z.infer<typeof unitSummarySchema>;
