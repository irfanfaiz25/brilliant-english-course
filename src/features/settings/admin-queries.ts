import "server-only";

import { eq, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import { settings, users } from "@/db/schema";
import type { SessionUser } from "@/features/users/schema";
import { assertCan, type Resource } from "@/lib/permissions";

import type { SettingKey } from "./keys";

/** When a setting was last saved and by whom (`null` = never saved, the code default applies). */
export type SettingMeta = { updatedAt: Date; updatedBy: string | null };

/**
 * Last-saved info of `keys`, for the "last changed" line on admin forms. Uncached, and checks
 * that the caller may read the module the keys belong to (`settings`, `seo`, `quota` or `users`).
 */
export async function getSettingMeta(
  actor: SessionUser,
  resource: Extract<Resource, "settings" | "seo" | "quota" | "users">,
  keys: readonly SettingKey[],
): Promise<Partial<Record<SettingKey, SettingMeta>>> {
  assertCan(actor, "read", resource);
  const rows = await db
    .select({ key: settings.key, updatedAt: settings.updatedAt, updatedBy: users.name })
    .from(settings)
    .leftJoin(users, eq(users.id, settings.updatedById))
    .where(inArray(settings.key, [...keys]));
  return Object.fromEntries(
    rows.map((row) => [row.key, { updatedAt: row.updatedAt, updatedBy: row.updatedBy }]),
  );
}
