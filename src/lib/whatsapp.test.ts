import { describe, expect, it } from "vitest";

import { buildWhatsAppUrl, normalizeWhatsAppNumber } from "./whatsapp";

describe("normalizeWhatsAppNumber", () => {
  it.each([
    ["0812-0000-0000", "6281200000000"],
    ["+62 812 0000 0000", "6281200000000"],
    ["6281200000000", "6281200000000"],
    ["81200000000", "6281200000000"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeWhatsAppNumber(input)).toBe(expected);
  });
});

describe("buildWhatsAppUrl", () => {
  it("encodes the pre-filled message", () => {
    expect(buildWhatsAppUrl("0812 0000 0000", "Halo BEC, saya mau tanya & daftar")).toBe(
      "https://wa.me/6281200000000?text=Halo+BEC%2C+saya+mau+tanya+%26+daftar",
    );
  });

  it("omits the text parameter without a message", () => {
    expect(buildWhatsAppUrl("6281200000000")).toBe("https://wa.me/6281200000000");
  });
});
