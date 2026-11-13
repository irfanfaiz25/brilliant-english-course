import "server-only";

import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import type { z } from "zod";

import { cacheTags } from "@/config/cache-tags";
import { db } from "@/db/client";
import { settings } from "@/db/schema";

import { contactSettingsDefaults } from "./defaults";
import type { SettingKey } from "./keys";
import { contactSettingsSchema, type ContactSettings } from "./schema";
import { parseSetting } from "./service";

/** The stored JSON of one setting (cached; only the key is part of the cache key). */
async function getStoredSetting(key: SettingKey): Promise<unknown> {
  "use cache";
  cacheTag(cacheTags.settings);
  cacheLife("hours");
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, key));
  return row?.value ?? null;
}

/**
 * A setting's value validated by `schema`, or `fallback` when no admin has saved it yet or the
 * stored document no longer matches the schema. Other domains read their settings through this
 * (e.g. the partnership package).
 */
export async function readSetting<T>(
  key: SettingKey,
  schema: z.ZodType<T>,
  fallback: T,
): Promise<T> {
  return parseSetting(key, await getStoredSetting(key), schema, fallback);
}

/** Head-office contact details: the saved `contact` setting or the code defaults. */
export async function getContactSettings(): Promise<ContactSettings> {
  return readSetting("contact", contactSettingsSchema, contactSettingsDefaults);
}
