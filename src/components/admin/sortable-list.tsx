"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import type { ReorderInput } from "@/lib/ordering";

import type { RowAction } from "./row-actions";
import { Sortable } from "./sortable";
import { useFormErrorText } from "./use-form-error-text";

export type SortableRow = {
  id: string;
  /** Spoken name of the row ("Book Day", "Ibu Sari"). */
  label: string;
  /** The row as rendered on the server (text, switches, links). */
  content: ReactNode;
};

type SortableListProps = {
  rows: readonly SortableRow[];
  /** Saves a new order: receives `{ ids, moved }` (`reorderSchema`). */
  action: RowAction;
  /** Without permission to reorder the rows render as a plain ordered list. */
  canReorder: boolean;
};

/**
 * A manually ordered admin list (Kegiatan, Testimoni, FAQ) whose rows are dragged into place.
 * The new order shows at once and is saved when a row is dropped; saves run one after another,
 * and a failed one (e.g. the order changed in another tab) reloads the server's order.
 */
export function SortableList({ rows, action, canReorder }: SortableListProps) {
  const t = useTranslations("AdminForms.sortable");
  const errorText = useFormErrorText();
  const router = useRouter();
  const serverOrder = rows.map((row) => row.id);
  const serverKey = serverOrder.join();
  const [order, setOrder] = useState(serverOrder);
  const [pending, setPending] = useState(0);
  // Saves run one after another, in the order the rows were dropped.
  const queue = useRef(Promise.resolve());

  // The server's order (after a refresh, or another tab's change) replaces the local one once no
  // save is waiting, so a refresh that lands between two drops cannot undo the second one.
  const [seenKey, setSeenKey] = useState(serverKey);
  if (serverKey !== seenKey && pending === 0) {
    setSeenKey(serverKey);
    setOrder(serverOrder);
  }

  const byId = new Map(rows.map((row) => [row.id, row]));
  const save = (ids: string[], moved: string) => {
    setPending((count) => count + 1);
    queue.current = queue.current.then(async () => {
      const input: ReorderInput = { ids, moved };
      const result = await action(input).catch(() => ({ ok: false as const, error: "unknown" }));
      if (result.ok) {
        toast.success(t("saved"));
      } else {
        toast.error(errorText(result.error));
        // Forget the order seen last, so the server's order is taken again once saves finish.
        setSeenKey("");
      }
      setPending((count) => count - 1);
      router.refresh();
    });
  };

  return (
    <Sortable
      values={order}
      onReorder={setOrder}
      onSettle={save}
      itemLabel={(id) => byId.get(id)?.label ?? ""}
      disabled={!canReorder}
      className="flex flex-col divide-y divide-border/60"
      itemClassName="py-3 pr-1"
    >
      {(id) => byId.get(id)?.content}
    </Sortable>
  );
}
