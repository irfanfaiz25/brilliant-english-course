import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { id, timestamps } from "./_helpers";
import { partnerLeads } from "./partners";
import { regions } from "./regions";
import { users } from "./users";

/**
 * Slots held in a village by partners who are onboarding but not yet listed as active units.
 * Village quota = active units + open reservations, capped by the `unitsPerVillage` setting
 * (`limits.unitsPerVillage` until Phase 4c). Expired reservations no longer count.
 */
export const quotaReservations = pgTable(
  "quota_reservations",
  {
    id: id(),
    villageCode: varchar({ length: 13 })
      .notNull()
      .references(() => regions.code),
    slots: smallint().notNull().default(1),
    leadId: uuid().references(() => partnerLeads.id, { onDelete: "set null" }),
    note: text().notNull().default(""),
    /** `null` = held until released by an admin. */
    expiresAt: timestamp({ withTimezone: true }),
    createdById: uuid().references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    index("quota_reservations_village_code_idx").on(table.villageCode),
    check("quota_reservations_slots_positive", sql`${table.slots} > 0`),
  ],
);

export type QuotaReservationRow = typeof quotaReservations.$inferSelect;
