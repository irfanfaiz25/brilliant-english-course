import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { notificationChannels, notificationStatuses } from "../../config/enums";
import { id } from "./_helpers";

export const notificationChannelEnum = pgEnum("notification_channel", notificationChannels);
export const notificationStatusEnum = pgEnum("notification_status", notificationStatuses);

/**
 * Delivery log written by the worker (Phase 6): one row per message per channel, so failures are
 * visible in admin. Queue state itself lives in pg-boss's own schema. Pruned on a schedule.
 */
export const notificationLog = pgTable(
  "notification_log",
  {
    id: id(),
    /** Event that triggered it, e.g. "lead.created". */
    event: varchar({ length: 64 }).notNull(),
    channel: notificationChannelEnum().notNull(),
    /** Address, chat id or phone number the message went to. */
    recipient: varchar({ length: 254 }).notNull(),
    status: notificationStatusEnum().notNull().default("queued"),
    attempts: smallint().notNull().default(0),
    error: text(),
    payload: jsonb().$type<Record<string, unknown>>(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    index("notification_log_created_at_idx").on(table.createdAt),
    index("notification_log_status_idx").on(table.status),
  ],
);

export type NotificationLogRow = typeof notificationLog.$inferSelect;
