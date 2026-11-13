"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { formatCount } from "./format-number";
import { motionEase } from "./tokens";

type CountUpProps = {
  value: number;
  /** Text after the number, e.g. "+" in "120+". */
  suffix?: string;
  prefix?: string;
  /** Seconds. */
  duration?: number;
  /**
   * Set when the number is invisible on first paint (e.g. inside `<Reveal>`, which starts at
   * opacity 0). It can then count from 0 even if it is already on screen, without a visible reset.
   */
  hiddenOnLoad?: boolean;
  className?: string;
};

/**
 * Counts from 0 to `value` the first time it scrolls into view.
 *
 * The final number is always in the server HTML (SEO, no-JS) and in a screen-reader-only copy.
 * If the number is already on screen when the page hydrates (e.g. above the fold), it stays
 * static — resetting a visible number to 0 would look like a glitch — unless `hiddenOnLoad` says
 * nothing is painted yet. Reduced motion always stays static.
 */
export function CountUp({
  value,
  suffix = "",
  prefix = "",
  duration = 1.2,
  hiddenOnLoad = false,
  className,
}: CountUpProps) {
  const locale = useLocale();
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<"static" | "armed" | "done">("static");
  const finalText = formatCount(value, locale);

  // On mount: arm the animation only when the number has not been seen yet. Runs once: the
  // reduced-motion preference resolves after the first render and must not reset a running count.
  useEffect(() => {
    const element = ref.current;
    if (!element || phase !== "static" || prefersReducedMotion !== false) return;
    const { top, bottom } = element.getBoundingClientRect();
    const visible = top < window.innerHeight && bottom > 0;
    if (hiddenOnLoad || !visible) {
      element.textContent = formatCount(0, locale);
      setPhase("armed");
    }
  }, [hiddenOnLoad, locale, phase, prefersReducedMotion]);

  useEffect(() => {
    const element = ref.current;
    if (phase !== "armed" || !isInView || !element) return;
    const controls = animate(0, value, {
      duration,
      ease: motionEase.out,
      onUpdate: (latest) => {
        element.textContent = formatCount(latest, locale);
      },
      onComplete: () => setPhase("done"),
    });
    return () => controls.stop();
  }, [phase, isInView, value, duration, locale]);

  return (
    <span className={className}>
      {/* Screen readers get the final value once, not every animated frame. */}
      <span className="sr-only">{`${prefix}${finalText}${suffix}`}</span>
      <span aria-hidden>
        {prefix}
        <span ref={ref} className="tabular-nums">
          {finalText}
        </span>
        {suffix}
      </span>
    </span>
  );
}
