import { describe, expect, it } from "vitest";

import { buildDirectionsUrl, formatUnitSchedule, unitInitials } from "./service";

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
