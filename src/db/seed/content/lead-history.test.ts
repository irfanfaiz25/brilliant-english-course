import { describe, expect, it } from "vitest";

import { leadHistory, unitOpenedDaysAgo } from "./lead-history";
import { unitFixtures } from "./units";

describe("leadHistory", () => {
  const history = leadHistory();

  it("is the same on every run", () => {
    expect(leadHistory()).toEqual(history);
  });

  it("covers a year without touching the last two weeks", () => {
    expect(Math.max(...history.map((lead) => lead.daysAgo))).toBeLessThan(400);
    expect(Math.min(...history.map((lead) => lead.daysAgo))).toBeGreaterThanOrEqual(14);
    expect(history.length).toBeGreaterThan(30);
  });

  it("converts one lead per sample unit, on the day the unit opened, after applying", () => {
    const conversions = history.filter((lead) => lead.conversion);
    expect(conversions).toHaveLength(unitFixtures.length);
    for (const lead of conversions) {
      const { unitIndex, convertedDaysAgo } = lead.conversion ?? {
        unitIndex: -1,
        convertedDaysAgo: 0,
      };
      expect(convertedDaysAgo).toBe(unitOpenedDaysAgo(unitIndex));
      expect(lead.daysAgo).toBeGreaterThan(convertedDaysAgo);
      expect(lead.status).toBe("converted");
      expect(lead.villageCode).toBe(unitFixtures[unitIndex]?.villageCode);
    }
  });

  it("uses unique WhatsApp numbers and never reserves a quota slot", () => {
    expect(new Set(history.map((lead) => lead.whatsapp)).size).toBe(history.length);
    expect(history.some((lead) => lead.status === "onboarding")).toBe(false);
  });
});
