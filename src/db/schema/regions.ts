import { sql } from "drizzle-orm";
import { check, index, pgEnum, pgTable, varchar, type AnyPgColumn } from "drizzle-orm/pg-core";

import { regionLevels } from "../../config/enums";

export const regionLevelEnum = pgEnum("region_level", regionLevels);

/**
 * Indonesian administrative regions keyed by their Kemendagri code ("32", "32.01", "32.01.01",
 * "32.01.01.2001"). Reference data loaded by `pnpm db:regions` from the checked-in dataset
 * (`src/db/seed/regions`), never edited in admin. Names are the official long forms
 * ("Kabupaten Bogor"); shortening is a display concern.
 */
export const regions = pgTable(
  "regions",
  {
    code: varchar({ length: 13 }).primaryKey(),
    /** Derived from the code; stored so the cascade and containment queries are plain lookups. */
    parentCode: varchar({ length: 13 }).references((): AnyPgColumn => regions.code),
    level: regionLevelEnum().notNull(),
    name: varchar({ length: 100 }).notNull(),
  },
  (table) => [
    index("regions_parent_code_idx").on(table.parentCode, table.name),
    index("regions_level_idx").on(table.level),
    // Trigram index: `name ILIKE '%bogor%'` and similarity searches stay well under 100 ms.
    index("regions_name_trgm_idx").using("gin", sql`${table.name} gin_trgm_ops`),
    check(
      "regions_code_format",
      sql`${table.code} ~ '^\\d{2}(\\.\\d{2}(\\.\\d{2}(\\.\\d{4})?)?)?$'`,
    ),
  ],
);

export type RegionRow = typeof regions.$inferSelect;
export type NewRegionRow = typeof regions.$inferInsert;
