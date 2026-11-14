import { describe, expect, it } from "vitest";

import { isSameList, reorderSchema } from "./ordering";

const a = "6f1c2c9e-8a5b-4d1e-9f3a-2b7c4d5e6f70";
const b = "7a2d3e4f-5b6c-4d7e-8f9a-0b1c2d3e4f50";
const c = "8b3e4f5a-6c7d-4e8f-9a0b-1c2d3e4f5a60";

describe("reorderSchema", () => {
  it("accepts every id once and a moved id among them", () => {
    expect(reorderSchema.safeParse({ ids: [b, a, c], moved: b }).success).toBe(true);
  });

  it("refuses repeated ids, a moved id outside the list and non-uuids", () => {
    expect(reorderSchema.safeParse({ ids: [a, a], moved: a }).success).toBe(false);
    expect(reorderSchema.safeParse({ ids: [a, b], moved: c }).success).toBe(false);
    expect(reorderSchema.safeParse({ ids: ["1"], moved: "1" }).success).toBe(false);
    expect(reorderSchema.safeParse({ ids: [], moved: a }).success).toBe(false);
  });
});

describe("isSameList", () => {
  it("is true for the same rows in another order", () => {
    expect(isSameList([a, b, c], [c, a, b])).toBe(true);
  });

  it("is false when a row was added, removed or repeated meanwhile", () => {
    expect(isSameList([a, b, c], [a, b])).toBe(false);
    expect(isSameList([a, b], [a, b, c])).toBe(false);
    expect(isSameList([a, b, c], [a, b, b])).toBe(false);
    expect(isSameList([a, b, c], [a, b, "other"])).toBe(false);
  });
});
