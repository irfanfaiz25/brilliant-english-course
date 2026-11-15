import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Relative import on purpose: drizzle-kit loads this folder without the `@/` alias.
import { levelThemes, schoolGrades } from "../../config/enums";
import { id, localeEnum, timestamps } from "./_helpers";
import { mediaAssets } from "./media";

export const levelThemeEnum = pgEnum("level_theme", levelThemes);
export const schoolGradeEnum = pgEnum("school_grade", schoolGrades);

/** Program levels (Kindy Class, Elementary, Secondary, …), each grouping its classes. Structured fields only; copy is in translations. */
export const programLevels = pgTable(
  "program_levels",
  {
    id: id(),
    /** Anchor on the Program page and stable key; set once from the name, never renamed. */
    slug: varchar({ length: 40 }).notNull().unique(),
    theme: levelThemeEnum().notNull().default("teal"),
    /**
     * Listed by the hero age chips. Levels in the finder may not share an age; levels outside it
     * (special programs) may overlap any range.
     */
    inAgeFinder: boolean().notNull().default(true),
    ageMin: smallint().notNull(),
    ageMax: smallint().notNull(),
    sessionsPerWeek: smallint().notNull(),
    maxStudentsPerClass: smallint().notNull(),
    imageId: uuid().references(() => mediaAssets.id, { onDelete: "set null" }),
    sortOrder: smallint().notNull().default(0),
    isPublished: boolean().notNull().default(true),
    ...timestamps,
  },
  (table) => [check("program_levels_age_range", sql`${table.ageMin} <= ${table.ageMax}`)],
);

export const programLevelTranslations = pgTable(
  "program_level_translations",
  {
    levelId: uuid()
      .notNull()
      .references(() => programLevels.id, { onDelete: "cascade" }),
    locale: localeEnum().notNull(),
    name: varchar({ length: 80 }).notNull(),
    tagline: varchar({ length: 120 }).notNull(),
    summary: text().notNull(),
    /** Short highlights for cards. */
    skills: text().array().notNull(),
    description: text().notNull(),
    /** "What children learn" list. */
    curriculum: text().array().notNull(),
    imageAlt: varchar({ length: 200 }).notNull().default(""),
  },
  (table) => [primaryKey({ columns: [table.levelId, table.locale] })],
);

/**
 * The classes inside a level, in teaching order (Smart Kindy 1, Smart Kindy 2, …), each for a span
 * of school years (ADR-040). Spans may overlap: placement also follows the child's ability.
 */
export const programClasses = pgTable(
  "program_classes",
  {
    id: id(),
    levelId: uuid()
      .notNull()
      .references(() => programLevels.id, { onDelete: "cascade" }),
    /** A proper name, the same in every locale ("Smart Kindy 1", "Basic"). */
    name: varchar({ length: 60 }).notNull(),
    gradeFrom: schoolGradeEnum().notNull(),
    gradeTo: schoolGradeEnum().notNull(),
    sortOrder: smallint().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("program_classes_level_id_idx").on(table.levelId),
    // Enum values compare in declaration order (TK < SD 1 < … < SMP 3).
    check("program_classes_grade_range", sql`${table.gradeFrom} <= ${table.gradeTo}`),
  ],
);

/** A class's optional one-line focus, per locale. */
export const programClassTranslations = pgTable(
  "program_class_translations",
  {
    classId: uuid()
      .notNull()
      .references(() => programClasses.id, { onDelete: "cascade" }),
    locale: localeEnum().notNull(),
    focus: varchar({ length: 120 }).notNull().default(""),
  },
  (table) => [primaryKey({ columns: [table.classId, table.locale] })],
);

export type ProgramLevelRow = typeof programLevels.$inferSelect;
export type ProgramLevelTranslationRow = typeof programLevelTranslations.$inferSelect;
export type ProgramClassRow = typeof programClasses.$inferSelect;
