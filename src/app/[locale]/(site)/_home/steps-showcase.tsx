"use client";

import { AnimatePresence, useInView, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { motionDuration, motionEase } from "@/components/motion/tokens";
import { cn } from "@/lib/utils";

import { stepDurationMs } from "./steps-timing";

export type ShowcaseStep = {
  title: string;
  text: string;
  /** Accessible label like "Step 1". */
  label: string;
  icon: ReactNode;
  /** Classes for the active marker (level color + glow). */
  tone: string;
  /** Preview shown beside the list when the step is active (server-rendered). */
  preview: ReactNode;
};

type StepsShowcaseProps = {
  steps: readonly ShowcaseStep[];
  tabsLabel: string;
};

/**
 * Interactive "how to join" stepper (DESIGN.md § 1.2: it shows the journey instead of describing it).
 * - Tabs pattern: click, or arrow keys / Home / End; the active step's text expands smoothly.
 * - Auto-plays while on screen, staying on each step long enough to read it (`stepDurationMs`,
 *   ~7 s); pauses on hover or focus and stops for good after a manual choice. No auto-play with
 *   reduced motion.
 * - Previews cross-fade (AnimatePresence) and their inner parts animate in with CSS.
 */
export function StepsShowcase({ steps, tabsLabel }: StepsShowcaseProps) {
  const baseId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [paused, setPaused] = useState(false);
  const inView = useInView(containerRef, { amount: 0.4 });
  const reduceMotion = useReducedMotion();

  const playing = autoplay && !reduceMotion && inView && !paused;
  const activeStep = steps[active];

  const select = (index: number, { focus = false } = {}) => {
    const next = (index + steps.length) % steps.length;
    setActive(next);
    setAutoplay(false);
    if (focus) tabRefs.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const moves: Record<string, number> = {
      ArrowDown: index + 1,
      ArrowRight: index + 1,
      ArrowUp: index - 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: steps.length - 1,
    };
    const target = moves[event.key];
    if (target === undefined) return;
    event.preventDefault();
    select(target, { focus: true });
  };

  return (
    <div
      ref={containerRef}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className="grid items-center gap-8 lg:grid-cols-[1fr_1.15fr] lg:gap-14"
    >
      <div
        role="tablist"
        aria-label={tabsLabel}
        aria-orientation="vertical"
        className="flex flex-col gap-3"
      >
        {steps.map((step, index) => {
          const selected = index === active;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.title} role="presentation" className="relative">
              {/*
               * Connector from this marker's center to the next one's. x/top = card padding + half the
               * 48 px marker (40 px, 44 px from `sm`); it runs past the 12 px gap into the next card.
               * It fills once the next step has been reached, so the path grows step by step.
               */}
              {!isLast && (
                <span
                  aria-hidden
                  className="absolute top-10 -bottom-13 left-10 w-0.5 -translate-x-1/2 overflow-hidden rounded-full bg-border sm:top-11 sm:-bottom-14 sm:left-11"
                >
                  <span
                    className={cn(
                      "block size-full origin-top bg-primary transition-[scale] duration-(--duration-slow) ease-out",
                      index < active ? "scale-y-100" : "scale-y-0",
                    )}
                  />
                </span>
              )}

              <button
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${index}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(index)}
                onKeyDown={(event) => onKeyDown(event, index)}
                className={cn(
                  "group relative flex w-full items-start gap-4 overflow-hidden rounded-2xl border p-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-(--duration-base) ease-out sm:p-5",
                  selected
                    ? "border-border/60 bg-card shadow-card"
                    : "border-transparent hover:translate-x-1 hover:bg-card/60",
                )}
              >
                <span
                  className={cn(
                    "relative z-10 inline-flex size-12 shrink-0 items-center justify-center rounded-2xl ring-4 ring-background transition-[background-color,color,box-shadow,scale] duration-(--duration-base) ease-out [&_svg]:size-6",
                    selected
                      ? cn("scale-105", step.tone)
                      : "bg-muted text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  {step.icon}
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-caption font-semibold text-muted-foreground uppercase">
                    {step.label}
                  </span>
                  <span
                    className={cn(
                      "text-h5",
                      selected ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {step.title}
                  </span>
                  {/* Description expands only for the active step (grid-rows height animation). */}
                  <span
                    className={cn(
                      "grid transition-[grid-template-rows,opacity] duration-(--duration-slow) ease-out",
                      selected ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <span className="min-h-0 overflow-hidden">
                      <span className="block pt-1 text-body-sm text-muted-foreground">
                        {step.text}
                      </span>
                    </span>
                  </span>
                </span>

                {selected && autoplay && !reduceMotion && (
                  <span
                    key={`progress-${active}`}
                    aria-hidden
                    onAnimationEnd={() => setActive((current) => (current + 1) % steps.length)}
                    style={{
                      animationDuration: `${stepDurationMs(`${step.title} ${step.text}`)}ms`,
                      animationTimingFunction: "linear",
                      animationPlayState: playing ? "running" : "paused",
                    }}
                    className="absolute inset-x-0 bottom-0 h-1 origin-left animate-grow-x bg-primary/70"
                  />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* `grid-cols-1` gives the preview a shrinkable track, so wide previews never overflow on phones. */}
      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active}`}
        className="relative isolate grid min-h-80 grid-cols-1 place-items-center overflow-hidden rounded-3xl border border-border/60 p-5 shadow-glow-primary bg-gradient-soft sm:min-h-96 sm:p-10"
      >
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={active}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: motionDuration.base, ease: motionEase.out }}
            className="w-full max-w-sm min-w-0"
          >
            {activeStep?.preview}
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
