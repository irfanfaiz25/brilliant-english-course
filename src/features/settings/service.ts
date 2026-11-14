import { eq } from "drizzle-orm";
import type { z } from "zod";

import { db } from "@/db/client";
import { settings } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit";

import type { SettingKey } from "./keys";

/**
 * Validates a stored setting. A missing row means "never saved" and returns the default; an
 * invalid document (e.g. saved before a schema change) also falls back, and is logged so it can
 * be re-saved from admin instead of breaking public pages.
 */
export function parseSetting<T>(
  key: SettingKey,
  stored: unknown,
  schema: z.ZodType<T>,
  fallback: T,
): T {
  if (stored === undefined || stored === null) return fallback;
  const parsed = schema.safeParse(stored);
  if (parsed.success) return parsed.data;
  console.warn(`[settings] "${key}" does not match its schema; using the code default.`);
  return fallback;
}

/**
 * Stores an already validated setting and its audit row (`before` / `after`) in one transaction.
 * The caller authorizes and revalidates; settings never hold secrets, so the full documents are
 * safe to keep in the audit log.
 */
export async function saveSetting(key: SettingKey, value: unknown, actorId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [previous] = await tx
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, key))
      .for("update");
    await tx
      .insert(settings)
      .values({ key, value, updatedById: actorId })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedById: actorId, updatedAt: new Date() },
      });
    await writeAuditLog(tx, {
      actorId,
      action: "settings.update",
      entityType: "setting",
      entityId: key,
      changes: { before: previous?.value ?? null, after: value },
    });
  });
}
