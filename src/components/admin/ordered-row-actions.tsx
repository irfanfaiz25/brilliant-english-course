import { ArrowDownIcon, ArrowUpIcon, PencilIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { ActionIconButton, DeleteButton, VisibilitySwitch, type RowAction } from "./row-actions";

type OrderedRowActionsProps = {
  id: string;
  isPublished: boolean;
  /** Position in its list, to disable "up" on the first row and "down" on the last. */
  index: number;
  total: number;
  editHref: string;
  actions: { publish: RowAction; move: RowAction; remove: RowAction };
  can: { update: boolean; publish: boolean; remove: boolean };
  /** Accessible names and texts, already naming the row ("Naikkan testimoni Ibu Sari"). */
  labels: {
    show: string;
    published: string;
    hidden: string;
    moveUp: string;
    moveDown: string;
    edit: string;
    remove: string;
    removeTitle: string;
    removeBody: string;
    removeConfirm: string;
    removed: string;
  };
};

/**
 * The actions of a row in a manually ordered content list (Kegiatan, Testimoni, FAQ): a
 * show/hide switch (a badge without `publish`), move up/down, edit and delete. Each control only
 * appears with its permission; the actions check it again on the server.
 */
export function OrderedRowActions({
  id,
  isPublished,
  index,
  total,
  editHref,
  actions,
  can,
  labels,
}: OrderedRowActionsProps) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end">
      {can.publish ? (
        <VisibilitySwitch
          action={actions.publish}
          input={{ id }}
          checked={isPublished}
          label={labels.show}
        />
      ) : (
        <Badge variant={isPublished ? "success" : "neutral"}>
          {isPublished ? labels.published : labels.hidden}
        </Badge>
      )}
      <div className="flex items-center gap-1">
        {can.update && (
          <>
            <ActionIconButton
              action={actions.move}
              input={{ id, direction: "up" }}
              label={labels.moveUp}
              icon={<ArrowUpIcon aria-hidden />}
              disabled={index === 0}
            />
            <ActionIconButton
              action={actions.move}
              input={{ id, direction: "down" }}
              label={labels.moveDown}
              icon={<ArrowDownIcon aria-hidden />}
              disabled={index === total - 1}
            />
            <Button asChild variant="ghost" size="icon-sm">
              <Link href={editHref} aria-label={labels.edit}>
                <PencilIcon aria-hidden />
              </Link>
            </Button>
          </>
        )}
        {can.remove && (
          <DeleteButton
            action={actions.remove}
            input={{ id }}
            label={labels.remove}
            title={labels.removeTitle}
            description={labels.removeBody}
            confirmLabel={labels.removeConfirm}
            successMessage={labels.removed}
          />
        )}
      </div>
    </div>
  );
}
