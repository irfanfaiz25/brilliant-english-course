"use client";

import * as m from "motion/react-m";
import type { Variants } from "motion/react";
import type { ReactNode } from "react";

import { motionDuration, motionEase, revealOffset, staggerStep } from "./tokens";

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: staggerStep } },
};

const item: Variants = {
  hidden: { opacity: 0, y: revealOffset },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: motionDuration.reveal, ease: motionEase.out },
  },
};

type StaggerProps = {
  children: ReactNode;
  className?: string;
  /** Rendered element; use `ul` with `StaggerItem as="li"` for lists. */
  as?: "div" | "ul" | "ol";
  /** Render in the final state, without the entrance (first-viewport content, see `Reveal`). */
  immediate?: boolean;
};

const containers = { div: m.div, ul: m.ul, ol: m.ol };
const items = { div: m.div, li: m.li, article: m.article };

/** Reveals its `StaggerItem` children one after another when the group scrolls into view. */
export function Stagger({ children, className, as = "div", immediate = false }: StaggerProps) {
  const Element = containers[as];

  return (
    <Element
      data-reveal=""
      className={className}
      variants={container}
      initial={immediate ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
    >
      {children}
    </Element>
  );
}

type StaggerItemProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
};

/** A child of `Stagger`. Keep groups to ~6 items so the last one doesn't arrive too late. */
export function StaggerItem({ children, className, as = "div" }: StaggerItemProps) {
  const Element = items[as];

  return (
    <Element data-reveal="" className={className} variants={item}>
      {children}
    </Element>
  );
}
