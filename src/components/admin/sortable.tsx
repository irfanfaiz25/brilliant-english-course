"use client";

import { GripVerticalIcon } from "lucide-react";
import { LazyMotion, MotionConfig, useDragControls } from "motion/react";
import { Reorder } from "motion/react-m";
import { useTranslations } from "next-intl";
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { motionDuration, motionEase } from "@/components/motion/tokens";
import { cn } from "@/lib/utils";

const loadFeatures = () => import("./sortable-features").then((module) => module.default);

/** Admin motion stays within 250 ms (DESIGN.md § 6); rows slide into place, no spring. */
const slide = { duration: motionDuration.base, ease: motionEase.out };

type SortableProps = {
  /** Item ids in their current order. */
  values: readonly string[];
  /** Every step of a move (while dragging, or per arrow key while an item is held). */
  onReorder: (order: string[], moved: string) => void;
  /** A move finished with a new order: the item was dropped (pointer or Space) or let go. */
  onSettle?: (order: string[], moved: string) => void;
  /** Spoken name of an item, e.g. "Book Day" or "Poin 2". */
  itemLabel: (id: string) => string;
  /** Without it, the list renders without handles (no permission to reorder). */
  disabled?: boolean;
  className?: string;
  itemClassName?: string;
  children: (id: string) => ReactNode;
};

/**
 * A list reordered by dragging a row's grip, built on Motion's `Reorder` (DESIGN.md § 6). The
 * engine loads lazily, rows slide into place within 250 ms (instantly with reduced motion), and
 * the window scrolls near its edges. Keyboard: Tab to a row, Space to pick it up, arrows to move,
 * Space to drop, Escape to put it back; each step is announced to screen readers.
 */
export function Sortable({
  values,
  onReorder,
  onSettle,
  itemLabel,
  disabled = false,
  className,
  itemClassName,
  children,
}: SortableProps) {
  const t = useTranslations("AdminForms.sortable");
  const instructionsId = useId();
  const [announcement, setAnnouncement] = useState("");
  const [held, setHeld] = useState<string | null>(null);
  // The committed order and the order when the held item was picked up, read by key and drag
  // handlers (an Escape restores the order in the same key press, before React renders it).
  const latest = useRef<readonly string[]>(values);
  const pickedUp = useRef<string>("");
  useLayoutEffect(() => {
    latest.current = values;
  });

  const pickUp = (id: string) => {
    setHeld(id);
    pickedUp.current = latest.current.join();
  };

  const announce = (key: "grabbed" | "moved" | "dropped", id: string, order = latest.current) =>
    setAnnouncement(
      t(key, { item: itemLabel(id), position: order.indexOf(id) + 1, total: order.length }),
    );

  const settle = (id: string) => {
    setHeld(null);
    if (latest.current.join() !== pickedUp.current) onSettle?.([...latest.current], id);
  };

  if (disabled) {
    return (
      <ol data-sortable="" className={className}>
        {values.map((id) => (
          <li key={id} className={itemClassName}>
            {children(id)}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">
        <p id={instructionsId} className="sr-only">
          {t("instructions")}
        </p>
        <p aria-live="assertive" className="sr-only">
          {announcement}
        </p>
        <Reorder.Group
          as="ol"
          axis="y"
          data-sortable=""
          values={[...values]}
          onReorder={(order: string[], moved: string) => {
            onReorder(order, moved);
            if (held === moved) announce("moved", moved, order);
          }}
          className={className}
        >
          {values.map((id) => (
            <SortableItem
              key={id}
              id={id}
              held={held === id}
              describedBy={instructionsId}
              handleLabel={t("handle", { item: itemLabel(id) })}
              className={itemClassName}
              onKeyDown={(event) => {
                // Motion handles the keys on the row itself; children (inputs, buttons) keep theirs.
                if (event.target !== event.currentTarget) return;
                if (event.key === " ") {
                  if (held === id) {
                    announce("dropped", id);
                    settle(id);
                  } else {
                    pickUp(id);
                    announce("grabbed", id);
                  }
                } else if (event.key === "Escape" && held === id) {
                  setAnnouncement(t("cancelled", { item: itemLabel(id) }));
                  // Motion restores the order in this key press; settle once React has rendered it.
                  setTimeout(() => settle(id));
                }
              }}
              onBlur={() => held === id && settle(id)}
              onDragStart={() => pickUp(id)}
              onDragEnd={() => {
                announce("dropped", id);
                settle(id);
              }}
            >
              {children(id)}
            </SortableItem>
          ))}
        </Reorder.Group>
      </MotionConfig>
    </LazyMotion>
  );
}

type SortableItemProps = {
  id: string;
  held: boolean;
  describedBy: string;
  handleLabel: string;
  className?: string;
  onKeyDown: (event: KeyboardEvent<HTMLLIElement>) => void;
  onBlur: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  children: ReactNode;
};

/** One row: the grip starts a drag (only the grip, so the page still scrolls on phones). */
function SortableItem({
  id,
  held,
  describedBy,
  handleLabel,
  className,
  onKeyDown,
  onBlur,
  onDragStart,
  onDragEnd,
  children,
}: SortableItemProps) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={id}
      dragListener={false}
      dragControls={controls}
      transition={slide}
      aria-describedby={describedBy}
      data-held={held || undefined}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "relative flex items-center gap-2 rounded-xl bg-transparent transition-[background-color,box-shadow] duration-(--duration-fast)",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "data-held:z-10 data-held:bg-card data-held:shadow-lg",
        className,
      )}
    >
      <span
        aria-hidden
        title={handleLabel}
        onPointerDown={(event) => controls.start(event)}
        className="flex h-11 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground transition-colors duration-(--duration-fast) select-none hover:bg-muted hover:text-foreground active:cursor-grabbing"
      >
        <GripVerticalIcon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </Reorder.Item>
  );
}
