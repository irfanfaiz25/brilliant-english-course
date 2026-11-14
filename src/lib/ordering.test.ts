import { describe, expect, it } from "vitest";

import { moveInOrder, moveSchema } from "./ordering";

describe("moveInOrder", () => {
  const ids = ["a", "b", "c"];

  it("swaps with the neighbour", () => {
    expect(moveInOrder(ids, "b", "up")).toEqual(["b", "a", "c"]);
    expect(moveInOrder(ids, "b", "down")).toEqual(["a", "c", "b"]);
  });

  it("keeps the order at either end or for an unknown id", () => {
    expect(moveInOrder(ids, "a", "up")).toEqual(ids);
    expect(moveInOrder(ids, "c", "down")).toEqual(ids);
    expect(moveInOrder(ids, "z", "up")).toEqual(ids);
  });

  it("does not change the list it was given", () => {
    const original = [...ids];
    moveInOrder(original, "b", "up");
    expect(original).toEqual(ids);
  });
});

describe("moveSchema", () => {
  it("accepts a row id and a direction only", () => {
    const id = "6f1c2c9e-8a5b-4d1e-9f3a-2b7c4d5e6f70";
    expect(moveSchema.safeParse({ id, direction: "up" }).success).toBe(true);
    expect(moveSchema.safeParse({ id, direction: "left" }).success).toBe(false);
    expect(moveSchema.safeParse({ id: "1", direction: "up" }).success).toBe(false);
  });
});
