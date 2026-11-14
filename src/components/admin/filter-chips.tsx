import Link from "next/link";

import { cn } from "@/lib/utils";

/** A filter pill (link or toggle) of an admin list. */
export const chipClass = (active: boolean) =>
  cn(
    "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-body-sm font-semibold whitespace-nowrap transition-colors duration-(--duration-fast)",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-background text-foreground hover:border-primary/60",
  );

/** The count bubble inside a chip. */
export const countClass = (active: boolean) =>
  cn("rounded-full px-2 text-caption", active ? "bg-white/20" : "bg-muted text-muted-foreground");

export type FilterChip = {
  /** Stable React key (the filter value, or "all"). */
  key: string;
  label: string;
  count?: number;
  href: string;
  active: boolean;
};

/**
 * One choice of an admin list filter as a row of link chips with counts, kept in the URL.
 * Scrolls sideways on phones; with `wrap`, wraps from `lg` where there is room.
 */
export function FilterChips({
  label,
  chips,
  wrap = false,
}: {
  label: string;
  chips: readonly FilterChip[];
  wrap?: boolean;
}) {
  return (
    <nav aria-label={label} className="-mx-1 overflow-x-auto px-1 pb-1">
      <ul className={cn("flex w-max gap-2", wrap && "lg:w-auto lg:flex-wrap")}>
        {chips.map((chip) => (
          <li key={chip.key}>
            <Link
              href={chip.href}
              aria-current={chip.active ? "page" : undefined}
              className={chipClass(chip.active)}
            >
              {chip.label}
              {chip.count !== undefined && (
                <span className={countClass(chip.active)}>{chip.count}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
