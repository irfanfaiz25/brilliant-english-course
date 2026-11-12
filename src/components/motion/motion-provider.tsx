"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

const loadFeatures = () => import("./features").then((module) => module.default);

/**
 * Root motion setup (DESIGN.md § 3.3):
 * - `LazyMotion` + `m` components keep the initial JS small; features load after hydration.
 * - `strict` fails loudly if someone imports the full `motion` component.
 * - `reducedMotion="user"` drops transform animations for visitors who ask for less motion.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
