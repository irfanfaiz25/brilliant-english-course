import { describe, expect, it } from "vitest";

import { nextUnitCode, provinceAbbreviations, unitSlugFromName } from "./codes";
import { unitFormSchema, type UnitFormInput } from "./schema";

describe("nextUnitCode", () => {
  it("continues after the highest code of the same province", () => {
    expect(nextUnitCode("32.01.06.2001", ["BEC-JB-0123", "BEC-JB-0098", "BEC-JT-0500"])).toBe(
      "BEC-JB-0124",
    );
  });

  it("starts at 0001 in a province without units", () => {
    expect(nextUnitCode("35.78.01.1001", ["BEC-JB-0123"])).toBe("BEC-JI-0001");
  });

  it("has a prefix for every one of the 38 provinces", () => {
    expect(Object.keys(provinceAbbreviations)).toHaveLength(38);
    expect(new Set(Object.values(provinceAbbreviations)).size).toBe(38);
  });
});

describe("unitSlugFromName", () => {
  it("drops the leading 'Unit' and slugifies the rest", () => {
    expect(unitSlugFromName("Unit Sukamaju")).toBe("sukamaju");
    expect(unitSlugFromName("BEC Cibinong Raya")).toBe("bec-cibinong-raya");
  });
});

describe("unitFormSchema", () => {
  const valid: UnitFormInput = {
    name: "Unit Sukamaju",
    slug: "sukamaju",
    status: "active",
    enrollment: "open",
    villageCode: "32.01.06.2001",
    address: "Jl. Raya Sukamaju No. 12, Kab. Bogor",
    latitude: -6.5512,
    longitude: 106.8513,
    managerName: "Ibu Rina",
    whatsapp: "0812-0000-0001",
    openDays: [1, 2, 3, 4, 5, 6],
    opensAt: "14:00",
    closesAt: "18:00",
    levels: ["kindy", "intro"],
    studentsCount: 40,
    openedAt: "",
  };
  const errorsOf = (input: unknown) => {
    const result = unitFormSchema.safeParse(input);
    return result.success
      ? {}
      : Object.fromEntries(result.error.issues.map((i) => [i.path.join("."), i.message]));
  };

  it("normalizes the WhatsApp number", () => {
    expect(unitFormSchema.parse(valid).whatsapp).toBe("6281200000001");
  });

  it("refuses coordinates outside Indonesia (e.g. swapped)", () => {
    expect(errorsOf({ ...valid, latitude: 106.85, longitude: -6.55 })).toEqual({
      latitude: "latitudeInvalid",
      longitude: "longitudeInvalid",
    });
  });

  it("needs a village, a level and closing after opening", () => {
    expect(errorsOf({ ...valid, villageCode: "32.01", levels: [], closesAt: "13:00" })).toEqual({
      villageCode: "villageRequired",
      levels: "levelsRequired",
      closesAt: "closesBeforeOpens",
    });
  });

  it("only accepts URL-safe slugs", () => {
    expect(errorsOf({ ...valid, slug: "Suka Maju!" })).toEqual({ slug: "slugInvalid" });
  });
});
