import { describe, expect, it } from "vitest";

import { contactSettingsSchema } from "@/features/settings/schema";
import { nextUnitCode } from "@/features/units/codes";
import { unitSummarySchema } from "@/features/units/schema";

import { levelFixtures } from "../content/programs";
import { starterContact, starterUnits } from "./content";

describe("starter content", () => {
  it("units are valid, unique and use levels that exist", () => {
    const levels = new Set(levelFixtures.id.map((level) => level.slug));
    for (const unit of starterUnits) {
      expect(() => unitSummarySchema.parse(unit)).not.toThrow();
      expect(unit.levels.every((slug) => levels.has(slug))).toBe(true);
      expect(unit.openedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(new Set(starterUnits.map((unit) => unit.code)).size).toBe(starterUnits.length);
    expect(new Set(starterUnits.map((unit) => unit.slug)).size).toBe(starterUnits.length);
  });

  it("unit codes carry the prefix of their province", () => {
    for (const unit of starterUnits) {
      const prefix = nextUnitCode(unit.villageCode, []).slice(0, 7);
      expect(unit.code.startsWith(prefix)).toBe(true);
    }
  });

  it("the head office contact is a valid setting", () => {
    expect(contactSettingsSchema.parse(starterContact)).toEqual(starterContact);
  });
});
