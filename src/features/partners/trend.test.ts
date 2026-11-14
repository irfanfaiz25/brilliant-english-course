import { describe, expect, it } from "vitest";

import { fillBuckets, parseTrendRange, trendBuckets, zonedDateKey } from "./trend";

// Saturday 14 Nov 2026, 20:00 UTC = Sunday 15 Nov 2026, 03:00 in Jakarta.
const now = new Date("2026-11-14T20:00:00Z");

describe("zonedDateKey", () => {
  it("uses the admin time zone, not UTC", () => {
    expect(zonedDateKey(now)).toBe("2026-11-15");
  });
});

describe("trendBuckets", () => {
  it("counts 30 calendar days ending today", () => {
    const { unit, keys, from } = trendBuckets("30d", now);
    expect(unit).toBe("day");
    expect(keys).toHaveLength(30);
    expect(keys.at(-1)).toBe("2026-11-15");
    expect(from).toBe("2026-10-17");
  });

  it("counts 12 weeks starting on Monday, the current week last", () => {
    const { keys } = trendBuckets("12w", now);
    expect(keys).toHaveLength(12);
    // Sunday 15 Nov belongs to the week of Monday 9 Nov.
    expect(keys.at(-1)).toBe("2026-11-09");
    expect(keys[0]).toBe("2026-08-24");
  });

  it("counts 12 months, the current month last, across a year change", () => {
    const { keys } = trendBuckets("12m", now);
    expect(keys[0]).toBe("2025-12-01");
    expect(keys.at(-1)).toBe("2026-11-01");
  });
});

describe("fillBuckets", () => {
  it("puts each count on its bucket and 0 elsewhere", () => {
    expect(
      fillBuckets(
        ["a", "b", "c"],
        [
          { key: "c", count: 4 },
          { key: "a", count: 1 },
        ],
      ),
    ).toEqual([1, 0, 4]);
  });
});

describe("parseTrendRange", () => {
  it("falls back to 12 weeks for anything unknown", () => {
    expect(parseTrendRange("30d")).toBe("30d");
    expect(parseTrendRange(undefined)).toBe("12w");
    expect(parseTrendRange("7y")).toBe("12w");
  });
});
