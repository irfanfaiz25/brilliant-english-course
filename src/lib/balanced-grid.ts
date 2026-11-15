/*
 * Card grids whose last row is always full (DESIGN.md § 2.3 "Balanced grids"): admins decide how
 * many items a list has, so a fixed column count leaves a lone card on the last row. Every grid
 * here has 12 tracks; a card spans 12 / columns, and the cards of a short last row share it
 * evenly (two cards under three columns take half each). Pure, so it is unit-tested.
 */

/** The breakpoints a balanced grid can change its column count at. */
export type GridBreakpoint = "base" | "sm" | "md" | "lg" | "xl";

/** Column count per breakpoint, e.g. `{ base: 1, sm: 2, lg: "auto" }`. */
export type GridColumns = Partial<Record<GridBreakpoint, number | "auto">>;

/**
 * The column count for `count` cards with at most `max` columns that avoids a lone last card:
 * all in one row when they fit, otherwise the widest count whose last row holds two or more
 * (5 → 3, 7 → 4, 9 → 3 with `max` 4).
 */
export function balancedColumns(count: number, max: number): number {
  if (count <= max) return Math.max(count, 1);
  for (let columns = max; columns >= 2; columns -= 1) {
    if (count % columns !== 1) return columns;
  }
  return max;
}

/** The span (in twelfths) of card `index` of `count` cards laid out in `columns` columns. */
export function balancedSpan(index: number, count: number, columns: number): number {
  const remainder = count % columns;
  const inLastRow = remainder > 0 && index >= count - remainder;
  return 12 / (inLastRow ? remainder : columns);
}

// Literal class names, so Tailwind sees every one of them.
const spanClasses: Record<GridBreakpoint, Record<number, string>> = {
  base: { 12: "col-span-12", 6: "col-span-6", 4: "col-span-4", 3: "col-span-3" },
  sm: { 12: "sm:col-span-12", 6: "sm:col-span-6", 4: "sm:col-span-4", 3: "sm:col-span-3" },
  md: { 12: "md:col-span-12", 6: "md:col-span-6", 4: "md:col-span-4", 3: "md:col-span-3" },
  lg: { 12: "lg:col-span-12", 6: "lg:col-span-6", 4: "lg:col-span-4", 3: "lg:col-span-3" },
  xl: { 12: "xl:col-span-12", 6: "xl:col-span-6", 4: "xl:col-span-4", 3: "xl:col-span-3" },
};

/** Tracks of the grid itself: always twelve. */
export const balancedGridClass = "grid grid-cols-12";

/**
 * The span classes of card `index` of `count`, per breakpoint. `"auto"` picks the column count
 * with `balancedColumns()` (up to four). Columns must divide 12: 1, 2, 3 or 4.
 */
export function balancedItemClass(index: number, count: number, columns: GridColumns): string {
  return (Object.entries(columns) as [GridBreakpoint, number | "auto"][])
    .map(([breakpoint, value]) => {
      const perRow = value === "auto" ? balancedColumns(count, 4) : value;
      return spanClasses[breakpoint][balancedSpan(index, count, perRow)];
    })
    .join(" ");
}
