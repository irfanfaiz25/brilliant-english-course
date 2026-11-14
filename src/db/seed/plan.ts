import type { Locale } from "@/i18n/routing";

/** Reference prefix of seeded sample leads; `--reset` deletes only these. */
export const SAMPLE_LEAD_PREFIX = "MTR-DEV-";

/**
 * Pure helpers for the dev seed: they turn the per-locale sample content (one array per locale,
 * written for review in Phase 5) into one record per entity with both translations.
 */

/** Pairs the `id` and `en` entries of a per-locale list by key, in Indonesian order. */
export function pairByKey<T>(
  content: Record<Locale, readonly T[]>,
  keyOf: (item: T) => string,
): Array<{ key: string; id: T; en: T }> {
  const english = new Map(content.en.map((item) => [keyOf(item), item]));
  return content.id.map((item) => {
    const key = keyOf(item);
    const en = english.get(key);
    if (!en) throw new Error(`Sample content "${key}" has no English version`);
    return { key, id: item, en };
  });
}

/** Instant of a calendar day at 08:00 in Jakarta (UTC+7), for seeded publish dates. */
export function jakartaMorning(day: string): Date {
  return new Date(`${day}T08:00:00+07:00`);
}

/**
 * Hosts a seed may write to. Seeding is for local Docker and CI's throwaway databases only; a
 * managed database is never seeded (AGENTS.md § 4, Database).
 */
export function isSeedableDatabase(databaseUrl: string, isCi: boolean): boolean {
  const host = new URL(databaseUrl).hostname;
  return isCi || host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}
