import { describe, expect, it } from "vitest";

import { monotonePath, niceScale } from "./chart";

describe("niceScale", () => {
  it("ends on a round number above the data", () => {
    expect(niceScale(7)).toEqual({ max: 8, ticks: [0, 2, 4, 6, 8] });
    expect(niceScale(37)).toEqual({ max: 40, ticks: [0, 10, 20, 30, 40] });
    expect(niceScale(130).max).toBeGreaterThanOrEqual(130);
  });

  it("keeps whole steps for small or empty data", () => {
    expect(niceScale(0)).toEqual({ max: 4, ticks: [0, 1, 2, 3, 4] });
    expect(niceScale(2).ticks).toEqual([0, 1, 2, 3, 4]);
  });
});

describe("monotonePath", () => {
  it("moves to the first point and ends on the last", () => {
    const path = monotonePath([
      [0, 10],
      [10, 0],
      [20, 5],
    ]);
    expect(path.startsWith("M0,10")).toBe(true);
    expect(path.endsWith("20,5")).toBe(true);
  });

  it("does not overshoot: control points stay within the neighbouring values", () => {
    // A flat run at the bottom (y = 100 is the axis) must not curve below it.
    const path = monotonePath([
      [0, 50],
      [10, 100],
      [20, 100],
      [30, 40],
    ]);
    const ys = [...path.matchAll(/,(-?[\d.]+)/g)].map((match) => Number(match[1]));
    expect(Math.max(...ys)).toBeLessThanOrEqual(100);
  });

  it("handles one point and no points", () => {
    expect(monotonePath([])).toBe("");
    expect(monotonePath([[5, 5]])).toBe("M5,5");
  });
});
