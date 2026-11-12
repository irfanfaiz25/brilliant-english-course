/**
 * JS mirror of the brand colors in `src/styles/globals.css`, for places that cannot read
 * CSS variables (OG images, `viewport.themeColor`, charts, emails).
 *
 * Keep values in sync with the CSS palette; `design-tokens.test.ts` fails on any drift.
 * Components must use Tailwind classes instead of these values.
 */
export const brandColors = {
  white: "#ffffff",
  cream: "#fffbf4",
  teal500: "#1b6e7e",
  teal700: "#124a55",
  orange500: "#dd6510",
  sunny500: "#f5a02a",
  neutral800: "#222b33",
  neutral900: "#121a20",
  whatsapp500: "#25d366",
} as const;

export type BrandColor = keyof typeof brandColors;

/** Maps each JS token to its CSS custom property name in `globals.css`. */
export const brandColorCssVar: Record<BrandColor, `--color-${string}`> = {
  white: "--color-white",
  cream: "--color-cream",
  teal500: "--color-teal-500",
  teal700: "--color-teal-700",
  orange500: "--color-orange-500",
  sunny500: "--color-sunny-500",
  neutral800: "--color-neutral-800",
  neutral900: "--color-neutral-900",
  whatsapp500: "--color-whatsapp-500",
};
