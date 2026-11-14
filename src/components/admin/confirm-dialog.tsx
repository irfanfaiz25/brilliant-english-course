"use client";

import { useTranslations } from "next-intl";
import { AlertDialog } from "radix-ui";

import { Button } from "@/components/ui/button";
import { overlayBackdropClass } from "@/components/ui/overlay-styles";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  /** Red confirm button for actions that delete or discard something. */
  destructive?: boolean;
  pending?: boolean;
};

/**
 * Confirmation for destructive or irreversible steps (DESIGN.md § 6): the title names the item,
 * focus starts on Cancel, and Escape cancels.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  destructive = false,
  pending = false,
}: ConfirmDialogProps) {
  const t = useTranslations("AdminForms");
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={overlayBackdropClass} />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-(--z-overlay) grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-5 rounded-xl bg-background p-6 shadow-lg duration-(--duration-base) data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:p-8">
          <div className="flex flex-col gap-2">
            <AlertDialog.Title className="text-h4 text-foreground">{title}</AlertDialog.Title>
            <AlertDialog.Description className="text-body text-muted-foreground">
              {description}
            </AlertDialog.Description>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="ghost" disabled={pending}>
                {t("cancel")}
              </Button>
            </AlertDialog.Cancel>
            <Button
              className={
                destructive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive-strong"
                  : undefined
              }
              loading={pending}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
