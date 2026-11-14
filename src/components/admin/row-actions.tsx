"use client";

import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Switch } from "radix-ui";
import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";

import { ConfirmDialog } from "./confirm-dialog";
import { useFormErrorText } from "./use-form-error-text";

/*
 * Small controls for list rows that call a Server Action directly (passed from the server page)
 * and refresh the list afterwards. Failures show as a toast with the translated error code.
 */

type RowAction = (input: unknown) => Promise<ActionResult<unknown>>;

function useRowAction() {
  const router = useRouter();
  const errorText = useFormErrorText();
  const [isPending, startTransition] = useTransition();
  const run = (action: RowAction, input: unknown, success?: string, after?: () => void) =>
    startTransition(async () => {
      const result = await action(input);
      if (!result.ok) {
        toast.error(errorText(result.error));
        return;
      }
      if (success) toast.success(success);
      after?.();
      router.refresh();
    });
  return { run, isPending };
}

type VisibilitySwitchProps = {
  action: RowAction;
  /** Identifies the row, e.g. `{ id }` or `{ slug }`; `isPublished` is added. */
  input: Record<string, string>;
  checked: boolean;
  /** Accessible name naming the item, e.g. "Tampilkan Book Day di situs". */
  label: string;
  disabled?: boolean;
};

/** Shown/hidden switch for a row; the visible text says the current state. */
export function VisibilitySwitch({
  action,
  input,
  checked,
  label,
  disabled,
}: VisibilitySwitchProps) {
  const t = useTranslations("AdminForms.visibility");
  const { run, isPending } = useRowAction();
  return (
    <span className="inline-flex items-center gap-2">
      <Switch.Root
        checked={checked}
        disabled={disabled || isPending}
        aria-label={label}
        onCheckedChange={(next) => run(action, { ...input, isPublished: next }, t("changed"))}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 border-transparent bg-neutral-300",
          "transition-colors duration-(--duration-fast) data-[state=checked]:bg-success",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        <Switch.Thumb className="block size-6 rounded-full bg-background shadow-sm transition-transform duration-(--duration-fast) data-[state=checked]:translate-x-5" />
      </Switch.Root>
      <span
        aria-hidden
        className={cn(
          "text-body-sm font-medium",
          checked ? "text-success-strong" : "text-muted-foreground",
        )}
      >
        {checked ? t("published") : t("hidden")}
      </span>
    </span>
  );
}

type ActionIconButtonProps = {
  action: RowAction;
  input: Record<string, string>;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
};

/** Icon button that runs one action quietly (e.g. move up / down). */
export function ActionIconButton({ action, input, label, icon, disabled }: ActionIconButtonProps) {
  const { run, isPending } = useRowAction();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      disabled={disabled || isPending}
      onClick={() => run(action, input)}
    >
      {icon}
    </Button>
  );
}

type DeleteButtonProps = {
  action: RowAction;
  input: Record<string, string>;
  /** Accessible name of the button, e.g. "Hapus Book Day". */
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  successMessage: string;
  /** Where to go after deleting (from an edit page); stays on the list otherwise. */
  redirectTo?: string;
  /** Show the label next to the icon (edit pages); icon only in list rows. */
  showLabel?: boolean;
};

/** Delete with a confirm dialog that names the item (DESIGN.md § 6). */
export function DeleteButton({
  action,
  input,
  label,
  title,
  description,
  confirmLabel,
  successMessage,
  redirectTo,
  showLabel = false,
}: DeleteButtonProps) {
  const router = useRouter();
  const { run, isPending } = useRowAction();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size={showLabel ? "sm" : "icon-sm"}
        aria-label={showLabel ? undefined : label}
        className="text-destructive-strong hover:bg-destructive-soft"
        onClick={() => setOpen(true)}
      >
        <Trash2Icon aria-hidden />
        {showLabel && label}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        destructive
        pending={isPending}
        onConfirm={() =>
          run(action, input, successMessage, () => {
            setOpen(false);
            if (redirectTo) router.replace(redirectTo);
          })
        }
      />
    </>
  );
}
