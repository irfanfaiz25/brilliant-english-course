import { describe, expect, it } from "vitest";

import { groupTranslations, pickTranslation } from "./translations";

const rows = [
  { entityId: "a", locale: "id" as const, title: "Halo" },
  { entityId: "a", locale: "en" as const, title: "Hello" },
  { entityId: "b", locale: "id" as const, title: "Saja" },
];

describe("pickTranslation", () => {
  it("returns the requested locale and falls back to Indonesian", () => {
    const groups = groupTranslations(rows, (row) => row.entityId);
    expect(pickTranslation(groups.get("a") ?? [], "en")?.title).toBe("Hello");
    expect(pickTranslation(groups.get("b") ?? [], "en")?.title).toBe("Saja");
    expect(pickTranslation([], "id")).toBeUndefined();
  });
});
