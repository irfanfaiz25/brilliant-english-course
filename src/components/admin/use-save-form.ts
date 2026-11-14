"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { FieldErrors, FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/action-result";

import { useFormErrorText } from "./use-form-error-text";

type SaveAction = (input: unknown) => Promise<ActionResult<unknown>>;

type SaveFormOptions<TValues extends FieldValues> = {
  /** Shapes the form values into the action's input (default: the raw values). */
  toInput?: (values: TValues) => unknown;
  /** Maps a field path of the action's input back to the form field (default: same path). */
  toFieldName?: (path: string) => string;
  /** Called after a successful save, e.g. to close a sheet or open the new record. */
  onSaved?: (data: unknown) => void;
  /** Called when validation fails (browser or server), e.g. to switch to the tab with errors. */
  onInvalid?: (errors: FieldErrors<TValues>) => void;
};

/**
 * Submit handler for admin forms: validates in the browser (the form's resolver), sends the raw
 * values to the Server Action (which validates again), then shows the outcome. Field errors from
 * the server land on their fields; a success marks the form clean and refreshes server data.
 */
export function useSaveForm<TValues extends FieldValues, TParsed extends FieldValues>(
  form: UseFormReturn<TValues, unknown, TParsed>,
  action: SaveAction,
  {
    toInput = (values) => values,
    toFieldName = (path) => path,
    onSaved,
    onInvalid,
  }: SaveFormOptions<TValues> = {},
) {
  const t = useTranslations("AdminForms");
  const errorText = useFormErrorText();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onSubmit = form.handleSubmit(
    () => {
      // Raw input, not the parsed output: the action parses with the same schema.
      const values = form.getValues();
      startTransition(async () => {
        const result = await action(toInput(values));
        if (result.ok) {
          form.reset(values);
          toast.success(t("saved"));
          onSaved?.(result.data);
          router.refresh();
          return;
        }
        for (const [name, code] of Object.entries(result.fieldErrors ?? {})) {
          form.setError(toFieldName(name) as FieldPath<TValues>, { message: code });
        }
        if (result.fieldErrors) onInvalid?.(form.formState.errors);
        toast.error(errorText(result.error));
      });
    },
    (errors) => onInvalid?.(errors),
  );

  return { onSubmit, isPending };
}
