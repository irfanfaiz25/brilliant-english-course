import type { z } from "zod";

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
