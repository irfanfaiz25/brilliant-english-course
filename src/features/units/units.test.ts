import { describe, expect, it } from "vitest";

import { unitFixtures } from "./fixtures";
import {
  buildDirectionsUrl,
  distanceKm,
  formatUnitSchedule,
  normalizeSearchText,
  searchUnits,
  unitInitials,
} from "./service";

describe("formatUnitSchedule", () => {
  it("collapses consecutive days into a range", () => {
    const unit = { openDays: [1, 2, 3, 4, 5, 6], opensAt: "14:00", closesAt: "18:00" };
    expect(formatUnitSchedule(unit, "id")).toBe("Senin – Sabtu · 14.00 – 18.00");
    expect(formatUnitSchedule(unit, "en")).toBe("Monday – Saturday · 14:00 – 18:00");
  });

  it("lists non-consecutive days", () => {
    const unit = { openDays: [5, 1, 3], opensAt: "09:00", closesAt: "12:00" };
    expect(formatUnitSchedule(unit, "en")).toBe("Monday, Wednesday, Friday · 09:00 – 12:00");
  });
});

describe("unit helpers", () => {
  it("builds a directions URL", () => {
    expect(buildDirectionsUrl("Jl. Raya No. 1, Bogor")).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=Jl.+Raya+No.+1%2C+Bogor",
    );
  });

  it("derives initials", () => {
    expect(unitInitials("Unit Sukamaju")).toBe("SU");
    expect(unitInitials("Unit Bojong Gede")).toBe("BG");
  });
});

describe("searchUnits", () => {
  it("filters by region, including every village inside it", () => {
    const names = searchUnits(unitFixtures, { regionCode: "32.01.01" }).map((u) => u.name);
    expect(names).toEqual(["Unit Cibinong", "Unit Pakansari"]);
  });

  it("matches all query words, ignoring case and accents", () => {
    expect(searchUnits(unitFixtures, { query: "pakánsari  CIBINONG" }).map((u) => u.name)).toEqual([
      "Unit Pakansari",
    ]);
    expect(searchUnits(unitFixtures, { query: "depok" }).map((u) => u.name)).toEqual([
      "Unit Depok Pancoran Mas",
      "Unit Kukusan",
    ]);
  });

  it("sorts by distance and reports it when a location is given", () => {
    const results = searchUnits(unitFixtures, { near: { lat: -6.48, lng: 106.85 } });
    expect(results[0]?.name).toBe("Unit Cibinong");
    expect(results[0]?.distanceKm).toBeLessThan(1);
    const distances = results.map((u) => u.distanceKm ?? 0);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
  });

  it("measures distance with the haversine formula", () => {
    // Jakarta (Monas) → Bogor (Kebun Raya) is about 47 km in a straight line.
    expect(
      distanceKm({ lat: -6.1754, lng: 106.8272 }, { lat: -6.5971, lng: 106.7992 }),
    ).toBeCloseTo(47, -1);
  });

  it("normalizes search text", () => {
    expect(normalizeSearchText("  Pakánsari   Indah ")).toBe("pakansari indah");
  });
});
