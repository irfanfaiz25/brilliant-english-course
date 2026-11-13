import { describe, expect, it } from "vitest";

import { finderQuery, parseFinderParams } from "./finder-params";

describe("parseFinderParams", () => {
  it("reads query, region and location", () => {
    expect(
      parseFinderParams({ q: " Cibinong ", wilayah: "32.01.01", lat: "-6.48", lng: "106.85" }),
    ).toEqual({
      query: "Cibinong",
      regionCode: "32.01.01",
      near: { lat: -6.48, lng: 106.85 },
      wantsLocation: false,
    });
  });

  it("drops invalid values instead of failing", () => {
    expect(parseFinderParams({ wilayah: "drop table", lat: "abc", lng: "200", q: "" })).toEqual({
      query: undefined,
      regionCode: undefined,
      near: undefined,
      wantsLocation: false,
    });
  });

  it("takes the first of repeated params and caps long queries", () => {
    const parsed = parseFinderParams({ q: ["a".repeat(200), "b"] });
    expect(parsed.query).toHaveLength(80);
  });

  it("uses the deepest selected region when every select submits a value", () => {
    expect(parseFinderParams({ wilayah: ["32", "32.01", ""] }).regionCode).toBe("32.01");
  });

  it("flags a pending location request only without coordinates", () => {
    expect(parseFinderParams({ dekat: "1" }).wantsLocation).toBe(true);
    expect(parseFinderParams({ dekat: "1", lat: "-6", lng: "106" }).wantsLocation).toBe(false);
  });
});

describe("finderQuery", () => {
  it("omits empty values and rounds coordinates", () => {
    expect(finderQuery({ regionCode: "32.01", near: { lat: -6.481234, lng: 106.85432 } })).toEqual({
      wilayah: "32.01",
      lat: "-6.481",
      lng: "106.854",
    });
    expect(finderQuery({})).toEqual({});
  });
});
