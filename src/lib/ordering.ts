import { z } from "zod";

/*
 * Manually ordered admin lists (activities, testimonials, FAQ): rows move one place up or down
 * and the list is renumbered 0, 1, 2, … in the same transaction.
 */

export const moveDirections = ["up", "down"] as const;
export type MoveDirection = (typeof moveDirections)[number];

/** Input of a "move" action: the row and where it goes. */
export const moveSchema = z.object({ id: z.uuid(), direction: z.enum(moveDirections) });

/** `ids` with `id` swapped with its neighbour in `direction`; unchanged at either end. */
export function moveInOrder(ids: readonly string[], id: string, direction: MoveDirection) {
  const from = ids.indexOf(id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= ids.length) return [...ids];
  const order = [...ids];
  [order[from], order[to]] = [order[to] as string, order[from] as string];
  return order;
}
