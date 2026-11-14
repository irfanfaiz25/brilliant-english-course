import { describe, expect, it } from "vitest";

import { activityFixtures } from "./content/activities";
import { faqFixtures } from "./content/faq";
import { levelFixtures } from "./content/programs";
import { testimonialFixtures } from "./content/testimonials";
import { isSeedableDatabase, jakartaMorning, pairByKey } from "./plan";

describe("pairByKey", () => {
  it("pairs every sample entity with its English version", () => {
    expect(pairByKey(levelFixtures, (level) => level.slug)).toHaveLength(levelFixtures.id.length);
    expect(pairByKey(activityFixtures, (activity) => activity.slug)).toHaveLength(
      activityFixtures.id.length,
    );
    expect(pairByKey(testimonialFixtures, (item) => item.id)).toHaveLength(
      testimonialFixtures.id.length,
    );
    expect(pairByKey(faqFixtures, (item) => item.id)).toHaveLength(faqFixtures.id.length);
  });

  it("fails when a translation is missing", () => {
    expect(() => pairByKey({ id: [{ k: "a" }], en: [] }, (item) => item.k)).toThrow(/English/);
  });
});

describe("jakartaMorning", () => {
  it("is 08:00 Western Indonesia Time", () => {
    expect(jakartaMorning("2026-11-06").toISOString()).toBe("2026-11-06T01:00:00.000Z");
  });
});

describe("isSeedableDatabase", () => {
  it("allows local databases and CI only", () => {
    expect(isSeedableDatabase("postgres://bec:bec@localhost:5433/bec", false)).toBe(true);
    expect(isSeedableDatabase("postgres://bec:bec@127.0.0.1:5433/bec", false)).toBe(true);
    expect(isSeedableDatabase("postgres://u:p@db.sumopod.example:5432/bec", false)).toBe(false);
    expect(isSeedableDatabase("postgres://u:p@db.sumopod.example:5432/bec", true)).toBe(true);
  });
});
