"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type ScrollRailProps = {
  /** The `<li>` items; give them a width and `snap-start` so a row of them overflows. */
  children: ReactNode;
  /** Accessible name of the list (also announced when it takes keyboard focus). */
  label: string;
  labels: { previous: string; next: string };
  /**
   * Classes of the list. The rail behavior (row, snap, scroll) applies from `md`, where the
   * arrows show; below it pass a layout of your own (e.g. a stacked grid) or let it scroll.
   */
  className?: string;
};

type Edges = { start: boolean; end: boolean };

/**
 * A horizontal row of cards that scrolls when there are more than fit (DESIGN.md § 4 Scroll rail). CSS scroll-snap does the scrolling; this only adds round arrow buttons that move one
 * view, and fades the edge on the side where more cards wait. Both disappear at that end, and
 * when everything fits. The list is focusable, so arrow keys scroll it, and anchors to an item
 * (`#level-…`) still scroll it into view.
 */
export function ScrollRail({ children, label, labels, className }: ScrollRailProps) {
  const ref = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState<Edges>({ start: false, end: false });

  useEffect(() => {
    const list = ref.current;
    if (!list) return;
    // A pixel of slack: fractional widths never quite reach the end.
    const update = () =>
      setEdges({
        start: list.scrollLeft > 1,
        end: list.scrollLeft + list.clientWidth < list.scrollWidth - 1,
      });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(list);
    list.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      list.removeEventListener("scroll", update);
    };
  }, []);

  const scroll = (direction: -1 | 1) => {
    const list = ref.current;
    if (!list) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollBy({
      left: direction * list.clientWidth * 0.9,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  const overflows = edges.start || edges.end;
  const mask =
    edges.start && edges.end
      ? "md:[mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
      : edges.end
        ? "md:[mask-image:linear-gradient(to_right,black_92%,transparent)]"
        : edges.start
          ? "md:[mask-image:linear-gradient(to_right,transparent,black_8%)]"
          : undefined;

  return (
    <div className="relative">
      <ul
        ref={ref}
        aria-label={label}
        tabIndex={overflows ? 0 : -1}
        className={cn(
          "md:flex md:snap-x md:snap-mandatory md:[scrollbar-width:none] md:overflow-x-auto md:overscroll-x-contain",
          "rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
          mask,
          className,
        )}
      >
        {children}
      </ul>
      <RailButton
        side="previous"
        label={labels.previous}
        visible={edges.start}
        onClick={() => scroll(-1)}
      />
      <RailButton side="next" label={labels.next} visible={edges.end} onClick={() => scroll(1)} />
    </div>
  );
}

function RailButton({
  side,
  label,
  visible,
  onClick,
}: {
  side: "previous" | "next";
  label: string;
  visible: boolean;
  onClick: () => void;
}) {
  const Icon = side === "previous" ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button
      type="button"
      aria-label={label}
      // The list itself scrolls with the keyboard; the arrows are a pointer shortcut.
      tabIndex={-1}
      onClick={onClick}
      className={cn(
        "absolute top-1/2 z-10 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-card text-foreground shadow-lg md:flex",
        "transition-[opacity,scale] duration-(--duration-base) ease-out hover:scale-105 hover:text-primary",
        side === "previous" ? "-left-3 lg:-left-6" : "-right-3 lg:-right-6",
        visible ? "opacity-100" : "pointer-events-none scale-90 opacity-0",
      )}
    >
      <Icon aria-hidden className="size-5" />
    </button>
  );
}
