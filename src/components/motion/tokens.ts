/**
 * Motion tokens for JS animations. Mirrors the CSS durations and easings in `globals.css`
 * (DESIGN.md § 3.1); Motion takes seconds and cubic-bezier arrays instead of CSS strings.
 */
export const motionDuration = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
  reveal: 0.6,
} as const;

export const motionEase = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const;

/** Rise distance for reveals, in px (DESIGN.md: 16–24 px). */
export const revealOffset = 24;

/** Delay between staggered children, in seconds (DESIGN.md: 60–80 ms). */
export const staggerStep = 0.07;
