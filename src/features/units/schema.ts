import { z } from "zod";

import { enrollmentStatuses, unitStatuses } from "@/config/enums";
import { limits } from "@/config/limits";
import { levelSlugs } from "@/features/programs/schema";
import { regionCodeSchema, villageCodeField } from "@/features/regions/schema";
import {
  integerField,
  textField,
  timeField,
  weekdaysField,
  whatsappField,
} from "@/lib/form-schemas";
import { slugSchemaPattern } from "@/lib/slug";

/** Network-wide numbers shown on the site; always computed from data, never typed in (AGENTS.md § 4). */
export const networkStatsSchema = z.object({
  activeUnits: z.number().int().nonnegative(),
  cities: z.number().int().nonnegative(),
  students: z.number().int().nonnegative(),
});

export type NetworkStats = z.infer<typeof networkStatsSchema>;

/** Whether a unit is taking new students. */
export { enrollmentStatuses };
export type EnrollmentStatus = (typeof enrollmentStatuses)[number];

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

/** What the public site needs to show a unit card. */
export const unitSummarySchema = z.object({
  code: z.string().regex(/^BEC-[A-Z]{2}-\d{4}$/),
  /** URL segment of the unit page, unique within its regency (admin-editable from Phase 4c). */
  slug: z.string().regex(slugSchemaPattern),
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

/*
 * Admin form (Phase 4c). The unit code is assigned once when the unit is created; the slug
 * defaults to the name and must be unique within the unit's regency (checked by the service).
 * Messages are codes (`lib/form-schemas`).
 */

/** Where a unit is in its life: only `active` units appear on the site and count for quota. */
export { unitStatuses };
export type UnitStatus = (typeof unitStatuses)[number];

const U = limits.units;

const coordinate = (range: { min: number; max: number }, code: string) =>
  z.number("numberRequired").min(range.min, code).max(range.max, code);

export const unitFormSchema = z
  .object({
    name: textField(3, U.nameMax),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "required")
      .max(U.slugMax, `tooLong:${U.slugMax}`)
      .regex(slugSchemaPattern, "slugInvalid"),
    status: z.enum(unitStatuses),
    enrollment: z.enum(enrollmentStatuses),
    villageCode: villageCodeField,
    address: textField(10, U.addressMax),
    latitude: coordinate(U.latitude, "latitudeInvalid"),
    longitude: coordinate(U.longitude, "longitudeInvalid"),
    managerName: textField(3, U.managerMax),
    whatsapp: whatsappField,
    openDays: weekdaysField,
    opensAt: timeField,
    closesAt: timeField,
    levels: z.array(z.enum(levelSlugs)).min(1, "levelsRequired"),
    studentsCount: integerField(0, U.studentsMax),
    /** `YYYY-MM-DD`, or "" when the opening date is not known yet. */
    openedAt: z.union([z.literal(""), z.iso.date("dateInvalid")]),
  })
  .refine((unit) => unit.closesAt > unit.opensAt, {
    message: "closesBeforeOpens",
    path: ["closesAt"],
  });

export type UnitFormInput = z.input<typeof unitFormSchema>;
export type UnitForm = z.output<typeof unitFormSchema>;

export const unitUpdateSchema = unitFormSchema.and(z.object({ id: z.uuid() }));
export const unitIdSchema = z.object({ id: z.uuid() });
