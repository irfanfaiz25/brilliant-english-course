import { adminTimeZone } from "@/config/admin-routes";

/*
 * Time buckets of the partner-lead trend on Ringkasan (Phase 4h, ADR-037). Pure, so the queries
 * and the tests share it. Buckets are calendar days, ISO weeks (Monday, like Postgres
 * `date_trunc('week')`) or months in the admin time zone, keyed "YYYY-MM-DD" by their first day.
 */

export const trendRanges = ["30d", "12w", "12m"] as const;
export type TrendRange = (typeof trendRanges)[number];
export const defaultTrendRange: TrendRange = "12w";

export type TrendUnit = "day" | "week" | "month";

const rangeSpec: Record<TrendRange, { unit: TrendUnit; count: number }> = {
  "30d": { unit: "day", count: 30 },
  "12w": { unit: "week", count: 12 },
  "12m": { unit: "month", count: 12 },
};

/** A known range from the URL, or the default. */
export function parseTrendRange(value: string | undefined): TrendRange {
  return trendRanges.find((range) => range === value) ?? defaultTrendRange;
}

/** "YYYY-MM-DD" of `instant` in the admin time zone. */
export function zonedDateKey(instant: Date, timeZone: string = adminTimeZone): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(instant);
}

const keyOf = (date: Date) => date.toISOString().slice(0, 10);
const fromKey = (key: string) => new Date(`${key}T00:00:00Z`);

/** First day of the bucket that contains calendar day `key`. */
function bucketStart(key: string, unit: TrendUnit): Date {
  const date = fromKey(key);
  if (unit === "week") date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  if (unit === "month") date.setUTCDate(1);
  return date;
}

function step(date: Date, unit: TrendUnit, by: number): Date {
  const next = new Date(date);
  if (unit === "day") next.setUTCDate(next.getUTCDate() + by);
  if (unit === "week") next.setUTCDate(next.getUTCDate() + 7 * by);
  if (unit === "month") next.setUTCMonth(next.getUTCMonth() + by);
  return next;
}

export type TrendBuckets = {
  unit: TrendUnit;
  /** Bucket keys, oldest first; the last one contains today. */
  keys: string[];
  /** First calendar day counted (the first bucket's key). */
  from: string;
};

/** The buckets of `range` ending with the one that contains `now`. */
export function trendBuckets(range: TrendRange, now: Date, timeZone?: string): TrendBuckets {
  const { unit, count } = rangeSpec[range];
  const last = bucketStart(zonedDateKey(now, timeZone), unit);
  const keys = Array.from({ length: count }, (_, index) =>
    keyOf(step(last, unit, index - (count - 1))),
  );
  return { unit, keys, from: keys[0] ?? keyOf(last) };
}

/** Counts per bucket key, in bucket order, with 0 for buckets nothing fell into. */
export function fillBuckets(
  keys: readonly string[],
  rows: readonly { key: string; count: number }[],
): number[] {
  const byKey = new Map(rows.map((row) => [row.key, row.count]));
  return keys.map((key) => byKey.get(key) ?? 0);
}
