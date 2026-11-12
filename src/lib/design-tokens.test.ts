import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { brandColorCssVar, brandColors, type BrandColor } from "./design-tokens";

const css = readFileSync(join(process.cwd(), "src/styles/globals.css"), "utf8");

function cssValue(variable: string): string | undefined {
  const match = css.match(new RegExp(`${variable}:\\s*([^;]+);`));
  return match?.[1]?.trim().toLowerCase();
}

describe("design tokens", () => {
  it.each(Object.keys(brandColors) as BrandColor[])("%s matches globals.css", (token) => {
    expect(cssValue(brandColorCssVar[token])).toBe(brandColors[token]);
  });
});
