import { describe, expect, it } from "vitest";

import { regionFixtures } from "@/db/seed/content/regions";

import {
  buildUnitDirectory,
  directoryPaths,
  resolveDirectoryPath,
  unitPathsByCode,
} from "./directory";
import { unitFixtures } from "@/db/seed/content/units";
import type { UnitSummary } from "./schema";

const directory = buildUnitDirectory(unitFixtures, regionFixtures);

describe("buildUnitDirectory", () => {
  it("groups units by province and regency with slugs", () => {
    const [jabar] = directory.provinces;
    expect(directory.provinces.map((p) => p.slug)).toEqual(["jawa-barat"]);
    expect(jabar?.unitCount).toBe(unitFixtures.length);
    expect(jabar?.regencies.map((r) => r.slug)).toEqual([
      "kab-bekasi",
      "kab-bogor",
      "kota-bogor",
      "kota-depok",
    ]);
    expect(jabar?.regencies[1]?.units.map((u) => u.path.join("/"))).toEqual([
      "jawa-barat/kab-bogor/cibinong",
      "jawa-barat/kab-bogor/pakansari",
      "jawa-barat/kab-bogor/sukamaju",
      "jawa-barat/kab-bogor/wanaherang",
    ]);
  });

  it("disambiguates repeated unit slugs with the unit code", () => {
    const [first] = unitFixtures as [UnitSummary];
    const twin = { ...first, code: "BEC-JB-0999", name: "Unit Sukamaju 2" };
    const result = buildUnitDirectory([first, twin], regionFixtures);
    expect(result.provinces[0]?.regencies[0]?.units.map((u) => u.path[2])).toEqual([
      "sukamaju-becjb0123",
      "sukamaju-becjb0999",
    ]);
  });

  it("skips units whose regions are unknown", () => {
    const [first] = unitFixtures as [UnitSummary];
    const lost = { ...first, villageCode: "99.99.99.9999" };
    expect(buildUnitDirectory([lost], regionFixtures).provinces).toEqual([]);
  });
});

describe("resolveDirectoryPath", () => {
  it("finds provinces, regencies and units", () => {
    expect(resolveDirectoryPath(directory, ["jawa-barat"])?.kind).toBe("province");
    expect(resolveDirectoryPath(directory, ["jawa-barat", "kota-depok"])?.kind).toBe("regency");
    const unit = resolveDirectoryPath(directory, ["jawa-barat", "kota-depok", "kukusan"]);
    expect(unit?.kind === "unit" && unit.unit.code).toBe("BEC-JB-0152");
  });

  it("returns null for unknown or too deep paths", () => {
    expect(resolveDirectoryPath(directory, ["banten"])).toBeNull();
    expect(resolveDirectoryPath(directory, ["jawa-barat", "kab-bogor", "nope"])).toBeNull();
    expect(
      resolveDirectoryPath(directory, ["jawa-barat", "kab-bogor", "sukamaju", "x"]),
    ).toBeNull();
    expect(resolveDirectoryPath(directory, [])).toBeNull();
  });
});

describe("directory helpers", () => {
  it("lists every page path and maps unit codes to paths", () => {
    expect(directoryPaths(directory)).toHaveLength(1 + 4 + unitFixtures.length);
    expect(unitPathsByCode(directory)["BEC-JB-0171"]).toEqual([
      "jawa-barat",
      "kota-bogor",
      "paledang",
    ]);
  });
});
