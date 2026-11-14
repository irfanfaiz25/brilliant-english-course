import { describe, expect, it } from "vitest";

import { levelFixtures } from "@/db/seed/content/programs";
import { findLevelForAge } from "./service";
import { levelSchema, levelSlugs } from "./schema";

describe("program levels", () => {
  it.each(["id", "en"] as const)("%s fixtures are valid and complete", (locale) => {
    const levels = levelFixtures[locale];
    levels.forEach((level) => expect(() => levelSchema.parse(level)).not.toThrow());
    expect(levels.map((level) => level.slug)).toEqual([...levelSlugs]);
  });

  it("age ranges cover 4–15 without gaps or overlaps", () => {
    const levels = levelFixtures.id;
    for (let age = 4; age <= 15; age += 1) {
      expect(levels.filter((l) => age >= l.ageMin && age <= l.ageMax)).toHaveLength(1);
    }
  });

  it("finds the level for an age", () => {
    expect(findLevelForAge(levelFixtures.id, 5)).toBe("kindy");
    expect(findLevelForAge(levelFixtures.id, 9)).toBe("intro");
    expect(findLevelForAge(levelFixtures.id, 12)).toBe("secondary");
    expect(findLevelForAge(levelFixtures.id, 17)).toBeUndefined();
  });
});
