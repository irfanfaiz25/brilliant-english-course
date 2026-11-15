import { sql } from "drizzle-orm";
import {
  check,
  date,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  boolean,
  smallint,
  text,
  time,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { enrollmentStatuses, unitStatuses } from "../../config/enums";
import { id, softDelete, timestamps } from "./_helpers";
import { mediaAssets } from "./media";
import { programClasses, programLevels } from "./programs";
import { regions } from "./regions";

export const unitStatusEnum = pgEnum("unit_status", unitStatuses);
export const enrollmentStatusEnum = pgEnum("enrollment_status", enrollmentStatuses);

/**
 * Partner-owned course units. Public pages show `active`, non-deleted units; quota counts them
 * per village (`limits.unitsPerVillage`). Network statistics (units, cities, students) are
 * computed from this table, never typed in (AGENTS.md § 4).
 */
export const units = pgTable(
  "units",
  {
    id: id(),
    /** Public unit code, e.g. "BEC-JB-0123". */
    code: varchar({ length: 12 }).notNull().unique(),
    /** URL segment, unique within the unit's regency (checked by the service, ADR-021). */
    slug: varchar({ length: 80 }).notNull(),
    name: varchar({ length: 120 }).notNull(),
    status: unitStatusEnum().notNull().default("onboarding"),
    enrollment: enrollmentStatusEnum().notNull().default("open"),
    villageCode: varchar({ length: 13 })
      .notNull()
      .references(() => regions.code),
    address: text().notNull(),
    latitude: doublePrecision().notNull(),
    longitude: doublePrecision().notNull(),
    managerName: varchar({ length: 120 }).notNull(),
    /** International digits without "+", e.g. "6281200000001". */
    whatsapp: varchar({ length: 16 }).notNull(),
    /** ISO weekdays the unit is open (1 = Monday … 7 = Sunday). */
    openDays: smallint().array().notNull(),
    opensAt: time().notNull(),
    closesAt: time().notNull(),
    /** Currently enrolled students, kept up to date by the unit owner / admin. */
    studentsCount: integer().notNull().default(0),
    /** First day of operation; shown on the unit page and used for "newest units". */
    openedAt: date(),
    ...timestamps,
    ...softDelete,
  },
  (table) => [
    index("units_village_code_idx").on(table.villageCode),
    index("units_status_idx").on(table.status),
    index("units_slug_idx").on(table.slug),
    check("units_village_level", sql`length(${table.villageCode}) = 13`),
    check(
      "units_coordinates",
      sql`${table.latitude} between -90 and 90 and ${table.longitude} between -180 and 180`,
    ),
  ],
);

/**
 * Which program levels a unit offers. `all_classes`: every class of the level, including ones
 * added later; otherwise only the classes listed in `unit_classes` (ADR-040).
 */
export const unitLevels = pgTable(
  "unit_levels",
  {
    unitId: uuid()
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    levelId: uuid()
      .notNull()
      .references(() => programLevels.id, { onDelete: "cascade" }),
    allClasses: boolean().notNull().default(true),
  },
  (table) => [primaryKey({ columns: [table.unitId, table.levelId] })],
);

/** The classes a unit opens in a level it offers only partly (`unit_levels.all_classes` off). */
export const unitClasses = pgTable(
  "unit_classes",
  {
    unitId: uuid()
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    classId: uuid()
      .notNull()
      .references(() => programClasses.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.unitId, table.classId] }),
    index("unit_classes_class_id_idx").on(table.classId),
  ],
);

export const unitPhotos = pgTable(
  "unit_photos",
  {
    id: id(),
    unitId: uuid()
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    mediaId: uuid()
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "cascade" }),
    caption: varchar({ length: 200 }).notNull().default(""),
    sortOrder: smallint().notNull().default(0),
    ...timestamps,
  },
  (table) => [index("unit_photos_unit_id_idx").on(table.unitId, table.sortOrder)],
);

export type UnitRow = typeof units.$inferSelect;
export type NewUnitRow = typeof units.$inferInsert;
