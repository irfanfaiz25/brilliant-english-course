import { describe, expect, it } from "vitest";

import { balancedColumns, balancedItemClass, balancedSpan } from "./balanced-grid";

describe("balancedColumns", () => {
  it("keeps up to `max` cards in one row", () => {
    expect([1, 2, 3, 4].map((count) => balancedColumns(count, 4))).toEqual([1, 2, 3, 4]);
  });

  it("never leaves a single card on the last row", () => {
    expect(balancedColumns(5, 4)).toBe(3); // 3 + 2
    expect(balancedColumns(6, 4)).toBe(4); // 4 + 2
    expect(balancedColumns(7, 4)).toBe(4); // 4 + 3
    expect(balancedColumns(9, 4)).toBe(3); // 3 + 3 + 3, not 4 + 4 + 1
    for (let count = 2; count <= 12; count += 1) {
      expect(count % balancedColumns(count, 4)).not.toBe(1);
    }
  });
});

describe("balancedSpan", () => {
  it("lets a short last row share the full width", () => {
    // 5 cards in 3 columns: three thirds, then two halves.
    expect([0, 1, 2, 3, 4].map((index) => balancedSpan(index, 5, 3))).toEqual([4, 4, 4, 6, 6]);
    // 4 cards in 4 columns: one full row.
    expect([0, 1, 2, 3].map((index) => balancedSpan(index, 4, 4))).toEqual([3, 3, 3, 3]);
  });
});

describe("balancedItemClass", () => {
  it("builds span classes per breakpoint", () => {
    const classes = [0, 1, 2, 3, 4].map((index) =>
      balancedItemClass(index, 5, { base: 1, sm: 2, lg: "auto" }),
    );
    expect(classes[0]).toBe("col-span-12 sm:col-span-6 lg:col-span-4");
    // The fifth card fills the second row on tablets and shares it with the fourth on desktop.
    expect(classes[4]).toBe("col-span-12 sm:col-span-12 lg:col-span-6");
  });
});
