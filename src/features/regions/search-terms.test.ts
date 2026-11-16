import { describe, expect, it } from "vitest";

import { fuzzyTerm, likeLiteral, MAX_REGION_TERMS, parseRegionQuery } from "./search-terms";

describe("parseRegionQuery", () => {
  it("splits on commas into lowercase terms with single spaces", () => {
    expect(parseRegionQuery("  Sanggrahan ,  PELEM ")).toEqual(["sanggrahan", "pelem"]);
    expect(parseRegionQuery("Tanah   Baru")).toEqual(["tanah baru"]);
  });

  it("reads 'kab' as 'kabupaten' in any term, like the official names", () => {
    expect(parseRegionQuery("Kab. Bogor")).toEqual(["kabupaten bogor"]);
    expect(parseRegionQuery("pelem, kab boyolali")).toEqual(["pelem", "kabupaten boyolali"]);
    expect(parseRegionQuery("kabupaten bogor")).toEqual(["kabupaten bogor"]);
  });

  it("needs a usable first term and drops short or repeated ones after it", () => {
    expect(parseRegionQuery("ab")).toEqual([]);
    expect(parseRegionQuery(", depok")).toEqual([]);
    expect(parseRegionQuery("beji, ab, depok, depok,")).toEqual(["beji", "depok"]);
  });

  it(`keeps at most ${MAX_REGION_TERMS} terms`, () => {
    expect(parseRegionQuery("a1x, b2x, c3x, d4x, e5x")).toHaveLength(MAX_REGION_TERMS);
  });
});

describe("likeLiteral", () => {
  it("escapes LIKE wildcards typed by the visitor", () => {
    expect(likeLiteral("100%_x")).toBe("100\\%\\_x");
  });
});

describe("fuzzyTerm", () => {
  it("compares regencies by their own name, not the shared prefix", () => {
    expect(fuzzyTerm("kabupaten bogor")).toBe("bogor");
    expect(fuzzyTerm("kota depok")).toBe("depok");
    expect(fuzzyTerm("kotabaru")).toBe("kotabaru");
  });
});
