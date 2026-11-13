/**
 * How long the join stepper stays on a step while auto-playing, from how much there is to read.
 *
 * Parents skim at roughly 200–240 words per minute (~250 ms per word). Each step also has a short
 * preview animation (~1 s) and needs a moment to glance at it, so a fixed base is added. The result
 * is clamped so short steps don't flash by and long ones don't stall: ~7 s for the current copy.
 */
export const STEP_READING = {
  baseMs: 3500,
  perWordMs: 250,
  minMs: 6000,
  maxMs: 10000,
} as const;

export function stepDurationMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const raw = STEP_READING.baseMs + words * STEP_READING.perWordMs;
  return Math.min(STEP_READING.maxMs, Math.max(STEP_READING.minMs, raw));
}
