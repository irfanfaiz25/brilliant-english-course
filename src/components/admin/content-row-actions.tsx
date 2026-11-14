import { PencilIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { DeleteButton, VisibilitySwitch, type RowAction } from "./row-actions";

type ContentRowActionsProps = {
  id: string;
  isPublished: boolean;
  editHref: string;
  actions: { publish: RowAction; remove: RowAction };
  can: { update: boolean; publish: boolean; remove: boolean };
  /** Accessible names and texts, already naming the row ("Hapus testimoni Ibu Sari"). */
  labels: {
    show: string;
    published: string;
    hidden: string;
    edit: string;
    remove: string;
    removeTitle: string;
    removeBody: string;
    removeConfirm: string;
    removed: string;
  };
};

/**
 * The actions of a row in a content list (Kegiatan, Testimoni, FAQ): a show/hide switch (a badge
 * without `publish`), edit and delete. Order is changed by dragging the row (`SortableList`).
 * Each control only appears with its permission; the actions check it again on the server.
 */
export function ContentRowActions({
  id,
  isPublished,
  editHref,
  actions,
  can,
  labels,
}: ContentRowActionsProps) {
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
          <Button asChild variant="ghost" size="icon-sm">
            <Link href={editHref} aria-label={labels.edit}>
              <PencilIcon aria-hidden />
            </Link>
          </Button>
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
