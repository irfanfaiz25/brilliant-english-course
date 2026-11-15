import { describe, expect, it } from "vitest";

import { slugify } from "./slug";
import { atLeastOneParam, placeholderParam } from "./static-params";

describe("atLeastOneParam", () => {
  it("keeps real params", () => {
    expect(atLeastOneParam([{ slug: "a" }, { slug: "b" }], { slug: placeholderParam })).toEqual([
      { slug: "a" },
      { slug: "b" },
    ]);
  });

  it("returns the placeholder when there is no data", () => {
    expect(atLeastOneParam([], { slug: placeholderParam })).toEqual([{ slug: "_" }]);
  });

  it("uses a segment no real slug can take", () => {
    expect(slugify(placeholderParam)).not.toBe(placeholderParam);
  });
});
