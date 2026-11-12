"use client";

import * as m from "motion/react-m";
import type { ReactNode } from "react";

import { motionDuration, motionEase, revealOffset } from "./tokens";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Seconds before the animation starts, for manual sequencing. */
  delay?: number;
  /** Rendered element; defaults to `div`. */
  as?: "div" | "section" | "li" | "article" | "header";
};

const elements = { div: m.div, section: m.section, li: m.li, article: m.article, header: m.header };

/**
 * Fades and lifts content into view once, when 20% of it is visible.
 * Use for below-the-fold content only: hero/LCP elements must render visible immediately.
 * Without JS the content stays visible (see the `[data-reveal]` noscript rule in the root layout).
 */
export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const Element = elements[as];

  return (
    <Element
      data-reveal=""
      className={className}
      initial={{ opacity: 0, y: revealOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: motionDuration.reveal, ease: motionEase.out, delay }}
    >
      {children}
    </Element>
  );
}
