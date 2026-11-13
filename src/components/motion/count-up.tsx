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
  className?: string;
};

/**
 * Counts from 0 to `value` the first time it scrolls into view.
 *
 * The final number is always in the server HTML (SEO, no-JS) and in the accessible name.
 * If the number is already on screen when the page hydrates (e.g. above the fold), it stays
 * static: resetting a visible number to 0 would look like a glitch. Reduced motion also stays static.
 */
export function CountUp({
  value,
  suffix = "",
  prefix = "",
  duration = 1.2,
  className,
}: CountUpProps) {
  const locale = useLocale();
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<"static" | "armed" | "done">("static");
  const finalText = formatCount(value, locale);

  // On mount: arm the animation only when the number is still off screen.
  useEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion) return;
    const { top, bottom } = element.getBoundingClientRect();
    const visible = top < window.innerHeight && bottom > 0;
    if (!visible) {
      element.textContent = formatCount(0, locale);
      setPhase("armed");
    }
  }, [locale, prefersReducedMotion]);

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
    <span className={className} aria-label={`${prefix}${finalText}${suffix}`}>
      <span aria-hidden>{prefix}</span>
      <span ref={ref} aria-hidden className="tabular-nums">
        {finalText}
      </span>
      <span aria-hidden>{suffix}</span>
    </span>
  );
}
