import { describe, expect, it, vi } from "vitest";

import { levelFixtures } from "@/db/seed/content/programs";
import { toRows } from "@/lib/form-schemas";

import { levelFormSchema, levelSchema, levelSlugs, type LevelFormInput } from "./schema";
import { findLevelForAge, overlapsAgeRange } from "./service";

// `service.ts` also writes levels; these checks do not need the database.
vi.mock("@/db/client", () => ({ db: {} }));
vi.mock("@/lib/audit", () => ({ writeAuditLog: vi.fn() }));

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

describe("overlapsAgeRange", () => {
  const others = [
    { ageMin: 4, ageMax: 6 },
    { ageMin: 10, ageMax: 15 },
  ];

  it("accepts a range between other levels", () => {
    expect(overlapsAgeRange({ ageMin: 7, ageMax: 9 }, others)).toBe(false);
  });

  it("rejects ranges that share an age, including the edges", () => {
    expect(overlapsAgeRange({ ageMin: 6, ageMax: 9 }, others)).toBe(true);
    expect(overlapsAgeRange({ ageMin: 7, ageMax: 10 }, others)).toBe(true);
    expect(overlapsAgeRange({ ageMin: 3, ageMax: 16 }, others)).toBe(true);
  });
});

describe("levelFormSchema", () => {
  const fixture = levelFixtures.id[0];
  if (!fixture) throw new Error("Missing level fixture");
  const text = {
    name: fixture.name,
    tagline: fixture.tagline,
    summary: fixture.summary,
    skills: toRows(fixture.skills),
    description: fixture.description,
    curriculum: toRows(fixture.curriculum),
    imageAlt: fixture.image.alt,
  };
  const valid: LevelFormInput = {
    slug: "kindy",
    ageMin: 4,
    ageMax: 6,
    sessionsPerWeek: 2,
    maxStudentsPerClass: 10,
    imageId: "8f14e45f-ceea-4672-8b67-6d1b1c5f8c11",
    isPublished: true,
    texts: { id: text, en: text },
  };
  const errorsOf = (input: unknown) => {
    const result = levelFormSchema.safeParse(input);
    return result.success
      ? {}
      : Object.fromEntries(result.error.issues.map((i) => [i.path.join("."), i.message]));
  };

  it("stores list rows as plain strings", () => {
    expect(levelFormSchema.parse(valid).texts.id.skills).toEqual(fixture.skills);
  });

  it("reports errors with their limit on the exact row", () => {
    const skills = [...text.skills, { value: "x" }];
    expect(errorsOf({ ...valid, texts: { ...valid.texts, en: { ...text, skills } } })).toEqual({
      "texts.en.skills.3.value": "tooShort:2",
    });
  });

  it("needs an image and a sensible age range", () => {
    expect(errorsOf({ ...valid, imageId: "", ageMin: 9, ageMax: 6 })).toEqual({
      imageId: "imageRequired",
      ageMax: "ageRange",
    });
    expect(errorsOf({ ...valid, sessionsPerWeek: Number.NaN })).toEqual({
      sessionsPerWeek: "numberRequired",
    });
  });
});
