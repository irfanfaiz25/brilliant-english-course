import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { parseSetting } from "./service";

const schema = z.object({ email: z.email() });
const fallback = { email: "default@bec.test" };

describe("parseSetting", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses the default when nothing is stored", () => {
    expect(parseSetting("contact", undefined, schema, fallback)).toBe(fallback);
    expect(parseSetting("contact", null, schema, fallback)).toBe(fallback);
  });

  it("returns a valid stored value", () => {
    expect(parseSetting("contact", { email: "halo@bec.id" }, schema, fallback)).toEqual({
      email: "halo@bec.id",
    });
  });

  it("falls back and warns when the stored value is invalid", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(parseSetting("contact", { email: "not-an-email" }, schema, fallback)).toBe(fallback);
    expect(warn).toHaveBeenCalledOnce();
  });
});
