import { describe, expect, it } from "vitest";

import { fillTemplate } from "./template";

describe("fillTemplate", () => {
  it("fills every known placeholder", () => {
    expect(fillTemplate("{min}–{max} tahun", { min: 4, max: 6 })).toBe("4–6 tahun");
    expect(fillTemplate("Ages {min}–{max}", { min: 10, max: 15 })).toBe("Ages 10–15");
  });

  it("keeps unknown placeholders", () => {
    expect(fillTemplate("{min} – {unit}", { min: 4 })).toBe("4 – {unit}");
  });
});
