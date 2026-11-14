"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FormFooterProps = {
  isDirty: boolean;
  isPending: boolean;
  onReset: () => void;
  /** Long forms: once dirty, a frosted bar that stays at the bottom of the viewport (DESIGN.md § 6). */
  sticky?: boolean;
  /** Create forms: saving is allowed before anything changed (the defaults may be enough). */
  saveWhenClean?: boolean;
  /** Submit label when "Save changes" does not fit, e.g. "Add activity". */
  saveLabel?: string;
};

/** Save / discard row at the end of an admin form, with an unsaved-changes note. */
export function FormFooter({
  isDirty,
  isPending,
  onReset,
  sticky = false,
  saveWhenClean = false,
  saveLabel,
}: FormFooterProps) {
  const t = useTranslations("AdminForms");
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end",
        // The bar follows the viewport only while there is something to save.
        sticky && isDirty
          ? "sticky bottom-3 z-(--z-sticky) rounded-2xl surface-glass-panel p-3 sm:pl-5"
          : "border-t border-border/60 pt-5",
      )}
    >
      <p aria-live="polite" className="text-body-sm text-muted-foreground sm:mr-auto">
        {isDirty ? t("unsaved") : null}
      </p>
      {isDirty && (
        <Button type="button" variant="ghost" onClick={onReset} disabled={isPending}>
          {t("reset")}
        </Button>
      )}
      <Button type="submit" loading={isPending} disabled={!isDirty && !saveWhenClean}>
        {saveLabel ?? t("save")}
      </Button>
    </div>
  );
}

/** "12/70 characters" under a text field; turns red past the limit. */
export function CharacterCount({ count, max, id }: { count: number; max: number; id?: string }) {
  const t = useTranslations("AdminForms");
  return (
    <span
      id={id}
      className={
        count > max
          ? "text-caption font-medium text-destructive-strong"
          : "text-caption text-muted-foreground"
      }
    >
      {t("characters", { count, max })}
    </span>
  );
}
