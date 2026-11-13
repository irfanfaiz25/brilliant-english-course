import { describe, expect, it } from "vitest";

import { regionFixtures } from "@/db/seed/content/regions";
import { regionCodeSchema } from "./schema";
import { isWithinRegion, parentRegionCode, regionCodePath, regionLevel } from "./service";

describe("region codes", () => {
  it("derive their level and parent from the code", () => {
    expect(regionLevel("32")).toBe("province");
    expect(regionLevel("32.01.01.2001")).toBe("village");
    expect(parentRegionCode("32.01.01")).toBe("32.01");
    expect(parentRegionCode("32")).toBeNull();
  });

  it("expand into the path from the province", () => {
    expect(regionCodePath("32.01.01.1002")).toEqual(["32", "32.01", "32.01.01", "32.01.01.1002"]);
  });

  it("check containment without prefix false positives", () => {
    expect(isWithinRegion("32.01.01.1002", "32.01")).toBe(true);
    expect(isWithinRegion("32.01", "32.01")).toBe(true);
    expect(isWithinRegion("32.016", "32.01")).toBe(false);
  });

  it("fixtures are valid and every parent exists", () => {
    const codes = new Set(regionFixtures.map((region) => region.code));
    for (const region of regionFixtures) {
      expect(() => regionCodeSchema.parse(region.code)).not.toThrow();
      const parent = parentRegionCode(region.code);
      if (parent) expect(codes.has(parent)).toBe(true);
    }
  });
});
