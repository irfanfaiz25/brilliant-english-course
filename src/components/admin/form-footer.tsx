"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

type FormFooterProps = {
  isDirty: boolean;
  isPending: boolean;
  onReset: () => void;
};

/** Save / discard row at the end of an admin form, with an unsaved-changes note. */
export function FormFooter({ isDirty, isPending, onReset }: FormFooterProps) {
  const t = useTranslations("AdminForms");
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-end">
      <p aria-live="polite" className="text-body-sm text-muted-foreground sm:mr-auto">
        {isDirty ? t("unsaved") : null}
      </p>
      {isDirty && (
        <Button type="button" variant="ghost" onClick={onReset} disabled={isPending}>
          {t("reset")}
        </Button>
      )}
      <Button type="submit" loading={isPending} disabled={!isDirty}>
        {t("save")}
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
