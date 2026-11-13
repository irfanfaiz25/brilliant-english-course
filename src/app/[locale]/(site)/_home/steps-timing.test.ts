import { describe, expect, it } from "vitest";

import { STEP_READING, stepDurationMs } from "./steps-timing";

describe("stepDurationMs", () => {
  it("gives a typical step (title + ~15-word text) about 7–8 seconds", () => {
    const text =
      "Chat admin unit Hubungi admin lewat WhatsApp untuk tanya biaya, jadwal, dan kelas percobaan.";
    expect(stepDurationMs(text)).toBeGreaterThanOrEqual(7000);
    expect(stepDurationMs(text)).toBeLessThanOrEqual(8000);
  });

  it("never goes below the minimum or above the maximum", () => {
    expect(stepDurationMs("Halo")).toBe(STEP_READING.minMs);
    expect(stepDurationMs("kata ".repeat(200))).toBe(STEP_READING.maxMs);
  });
});
