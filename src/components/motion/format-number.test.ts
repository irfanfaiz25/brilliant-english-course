import { describe, expect, it } from "vitest";

import { formatCount } from "./format-number";

describe("formatCount", () => {
  it("uses the locale's grouping separator", () => {
    expect(formatCount(5400, "id")).toBe("5.400");
    expect(formatCount(5400, "en")).toBe("5,400");
  });

  it("rounds intermediate animation values to integers", () => {
    expect(formatCount(127.6, "id")).toBe("128");
    expect(formatCount(0.4, "en")).toBe("0");
  });
});
