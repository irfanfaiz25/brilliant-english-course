import { routing, type Locale } from "@/i18n/routing";

/**
 * The translation row for `locale`, falling back to the default locale (`en` → `id`, ADR-005)
 * when the requested one is missing. `undefined` only when the entity has no translation at all.
 */
export function pickTranslation<T extends { locale: Locale }>(
  rows: readonly T[],
  locale: Locale,
): T | undefined {
  return (
    rows.find((row) => row.locale === locale) ??
    rows.find((row) => row.locale === routing.defaultLocale)
  );
}

/** Groups translation rows by the entity they belong to. */
export function groupTranslations<T>(
  rows: readonly T[],
  entityId: (row: T) => string,
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const id = entityId(row);
    groups.set(id, [...(groups.get(id) ?? []), row]);
  }
  return groups;
}
