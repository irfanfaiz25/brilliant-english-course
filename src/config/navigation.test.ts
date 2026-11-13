import { describe, expect, it } from "vitest";

import { isActivePath, isPartnerPath } from "./navigation";

describe("isActivePath", () => {
  it("matches the section and its sub-pages", () => {
    expect(isActivePath("/blog", "/blog")).toBe(true);
    expect(isActivePath("/blog/tips-belajar", "/blog")).toBe(true);
  });

  it("does not match lookalike prefixes or the home page loosely", () => {
    expect(isActivePath("/blogger", "/blog")).toBe(false);
    expect(isActivePath("/program", "/")).toBe(false);
    expect(isActivePath("/", "/")).toBe(true);
  });
});

describe("isPartnerPath", () => {
  it("detects partnership pages", () => {
    expect(isPartnerPath("/kemitraan")).toBe(true);
    expect(isPartnerPath("/cek-unit")).toBe(false);
  });
});
