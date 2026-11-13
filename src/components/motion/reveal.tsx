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
  /**
   * Render in the final state, without the entrance. Use when the block can sit in the first
   * viewport: content painted at opacity 0 only counts for LCP once JS runs (DESIGN.md § 3).
   */
  immediate?: boolean;
};

const elements = { div: m.div, section: m.section, li: m.li, article: m.article, header: m.header };

/**
 * Fades and lifts content into view once, when 20% of it is visible.
 * Use for below-the-fold content; pass `immediate` when it may land in the first viewport.
 * Without JS the content stays visible (see the `[data-reveal]` noscript rule in the root layout).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
  immediate = false,
}: RevealProps) {
  const Element = elements[as];

  return (
    <Element
      data-reveal=""
      className={className}
      initial={immediate ? false : { opacity: 0, y: revealOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: motionDuration.reveal, ease: motionEase.out, delay }}
    >
      {children}
    </Element>
  );
}
