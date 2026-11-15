"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { fillTemplate } from "@/lib/template";
import { cn } from "@/lib/utils";

type Stage = { title: string; text: string };

type LessonFlowProps = {
  stages: Stage[];
  labels: {
    /** Accessible name of the stage list, e.g. "Tahap satu sesi kelas". */
    list: string;
    /** "Tahap {current} dari {total}". */
    progress: string;
    previous: string;
    next: string;
  };
};

/**
 * One BEC lesson, stage by stage (ADR-041): a tab list of numbered stages over a panel with the
 * stage's purpose, a progress bar and previous/next buttons. Keyboard: arrows, Home and End move
 * between tabs (roving tabindex). No autoplay, so the visitor sets the pace.
 */
export function LessonFlow({ stages, labels }: LessonFlowProps) {
  const id = useId();
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const stage = stages[active];
  if (!stage) return null;

  const select = (index: number, focus = false) => {
    const next = (index + stages.length) % stages.length;
    setActive(next);
    const tab = tabs.current[next];
    if (focus) tab?.focus();
    // Keep the chosen stage visible in the scrolling row (instant with reduced motion).
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    tab?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: smooth ? "smooth" : "auto",
    });
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const keys: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowDown: active + 1,
      ArrowLeft: active - 1,
      ArrowUp: active - 1,
      Home: 0,
      End: stages.length - 1,
    };
    const target = keys[event.key];
    if (target === undefined) return;
    event.preventDefault();
    select(target, true);
  };

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-border/60 bg-card p-5 shadow-card sm:p-7">
      <div
        role="tablist"
        aria-label={labels.list}
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        className="-mx-1 flex snap-x [scrollbar-width:none] gap-2 overflow-x-auto px-1 pb-1"
      >
        {stages.map((item, index) => {
          const selected = index === active;
          const done = index < active;
          return (
            <button
              key={item.title}
              ref={(node) => {
                tabs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${index}`}
              aria-selected={selected}
              aria-controls={`${id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(index)}
              className={cn(
                "inline-flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-full border px-3 pr-4 text-label transition-colors duration-(--duration-fast)",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                selected
                  ? "border-transparent bg-partner text-partner-foreground shadow-glow-partner"
                  : done
                    ? "border-partner/30 bg-partner-soft text-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full text-caption font-semibold",
                  selected ? "bg-partner-foreground/20" : "bg-muted",
                )}
              >
                {index + 1}
              </span>
              {item.title}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${active}`}
        className="flex flex-col gap-4"
      >
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <span
            className="block h-full rounded-full bg-partner transition-[width] duration-(--duration-base) ease-out"
            style={{ width: `${((active + 1) / stages.length) * 100}%` }}
          />
        </div>
        <p className="text-overline text-partner uppercase">
          {fillTemplate(labels.progress, { current: active + 1, total: stages.length })}
        </p>
        {/* A new key per stage replays the entrance, so the change is felt (instant with reduced motion). */}
        <div
          key={active}
          className="flex animate-rise-in flex-col gap-2 motion-reduce:animate-none"
        >
          <h3 className="text-h3 text-foreground">{stage.title}</h3>
          {stage.text && <p className="text-body-lg text-muted-foreground">{stage.text}</p>}
        </div>
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => select(active - 1)}
            disabled={active === 0}
          >
            <ArrowLeftIcon aria-hidden />
            {labels.previous}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => select(active + 1)}
            disabled={active === stages.length - 1}
          >
            {labels.next}
            <ArrowRightIcon aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
