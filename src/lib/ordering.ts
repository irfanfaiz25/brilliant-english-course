import { z } from "zod";

/*
 * Manually ordered admin lists (activities, testimonials, FAQ): rows are dragged into place and
 * the whole new order of the list (or of one group of it) is saved at once, renumbered 0, 1, 2, …
 * in one transaction.
 */

/** Longest list one save may reorder; far above any real list. */
export const reorderMax = 500;

/** Input of a "reorder" action: every id of the list in its new order, and the row that moved. */
export const reorderSchema = z
  .object({
    ids: z.array(z.uuid()).min(1).max(reorderMax),
    moved: z.uuid(),
  })
  .refine(({ ids }) => new Set(ids).size === ids.length, "invalid")
  .refine(({ ids, moved }) => ids.includes(moved), "invalid");

export type ReorderInput = z.input<typeof reorderSchema>;

/**
 * Whether `requested` holds exactly the rows of `current`, in any order. When it does not, the
 * list changed since the page was loaded (a row added or deleted elsewhere) and saving the order
 * would drop or invent rows.
 */
export function isSameList(current: readonly string[], requested: readonly string[]): boolean {
  if (current.length !== requested.length) return false;
  const remaining = new Set(current);
  return requested.every((id) => remaining.delete(id));
}
