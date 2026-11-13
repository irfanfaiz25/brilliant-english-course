import { index, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { leadStatuses, partnerBackgrounds, partnerSpaceOptions } from "../../config/enums";
import { id, localeEnum, softDelete, timestamps } from "./_helpers";
import { regions } from "./regions";
import { units } from "./units";
import { users } from "./users";

export const partnerBackgroundEnum = pgEnum("partner_background", partnerBackgrounds);
export const partnerSpaceEnum = pgEnum("partner_space", partnerSpaceOptions);
export const leadStatusEnum = pgEnum("lead_status", leadStatuses);

/**
 * Partner applications from the Kemitraan form (ADR-007, ADR-018), worked as a pipeline in admin
 * (Phase 4d). A lead in `onboarding` holds a quota slot through `quota_reservations`.
 */
export const partnerLeads = pgTable(
  "partner_leads",
  {
    id: id(),
    /** Human-friendly reference quoted on WhatsApp, e.g. "MTR-261113-7KQ4". */
    reference: varchar({ length: 20 }).notNull().unique(),
    fullName: varchar({ length: 80 }).notNull(),
    whatsapp: varchar({ length: 16 }).notNull(),
    email: varchar({ length: 254 }),
    background: partnerBackgroundEnum().notNull(),
    space: partnerSpaceEnum().notNull(),
    motivation: text().notNull().default(""),
    villageCode: varchar({ length: 13 })
      .notNull()
      .references(() => regions.code),
    /** Site language used when applying; notifications reply in it. */
    locale: localeEnum().notNull(),
    status: leadStatusEnum().notNull().default("new"),
    assignedToId: uuid().references(() => users.id, { onDelete: "set null" }),
    /** Set when the lead becomes a unit. */
    unitId: uuid().references(() => units.id, { onDelete: "set null" }),
    /** Hashed client IP for abuse review; never the raw address. */
    ipHash: varchar({ length: 64 }),
    ...timestamps,
    ...softDelete,
  },
  (table) => [
    index("partner_leads_status_idx").on(table.status, table.createdAt),
    index("partner_leads_village_code_idx").on(table.villageCode),
    index("partner_leads_whatsapp_idx").on(table.whatsapp),
  ],
);

/** Follow-up notes written by staff while working a lead. */
export const partnerLeadNotes = pgTable(
  "partner_lead_notes",
  {
    id: id(),
    leadId: uuid()
      .notNull()
      .references(() => partnerLeads.id, { onDelete: "cascade" }),
    authorId: uuid().references(() => users.id, { onDelete: "set null" }),
    body: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("partner_lead_notes_lead_id_idx").on(table.leadId, table.createdAt)],
);

export type PartnerLeadRow = typeof partnerLeads.$inferSelect;
export type NewPartnerLeadRow = typeof partnerLeads.$inferInsert;
