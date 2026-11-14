"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";
import {
  get,
  useFieldArray,
  type ArrayPath,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useFormErrorText } from "./use-form-error-text";

type StringListFieldProps<TValues extends FieldValues> = {
  form: UseFormReturn<TValues, unknown, unknown>;
  /** Field array of `{ value }` rows (`rowListField` in `lib/form-schemas`). */
  name: ArrayPath<TValues>;
  label: string;
  description?: string;
  /** Accessible name of row `index` (1-based), e.g. "Poin 2". */
  itemLabel: (index: number) => string;
  addLabel: string;
  min: number;
  max: number;
  maxLength?: number;
};

/**
 * An editable list of short texts (skills, curriculum, inclusions): one input per row, remove per
 * row, add at the end. Row and list errors from the shared schema show under their inputs.
 */
export function StringListField<TValues extends FieldValues>({
  form,
  name,
  label,
  description,
  itemLabel,
  addLabel,
  min,
  max,
  maxLength,
}: StringListFieldProps<TValues>) {
  const t = useTranslations("AdminForms");
  const errorText = useFormErrorText();
  const id = useId();
  const rows = useFieldArray({ control: form.control, name });
  const errors = get(form.formState.errors, name) as
    | (Record<number, { value?: { message?: string } }> & { root?: { message?: string } })
    | { message?: string }
    | undefined;
  const listError =
    errors && "root" in errors ? errors.root?.message : (errors as { message?: string })?.message;

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-label text-foreground">{label}</legend>
      {description && <p className="text-body-sm text-muted-foreground">{description}</p>}
      <ol className="flex flex-col gap-2">
        {rows.fields.map((row, index) => {
          const rowErrors = errors as Record<number, { value?: { message?: string } }> | undefined;
          const message = errorText(rowErrors?.[index]?.value?.message);
          const errorId = `${id}-${index}-error`;
          return (
            <li key={row.id} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Input
                  {...form.register(`${name}.${index}.value` as Path<TValues>)}
                  aria-label={itemLabel(index + 1)}
                  aria-invalid={message ? true : undefined}
                  aria-describedby={message ? errorId : undefined}
                  maxLength={maxLength}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => rows.remove(index)}
                  disabled={rows.fields.length <= min}
                  aria-label={t("removeItem", { item: itemLabel(index + 1) })}
                >
                  <Trash2Icon aria-hidden />
                </Button>
              </div>
              {message && (
                <p
                  id={errorId}
                  role="alert"
                  className="text-body-sm font-medium text-destructive-strong"
                >
                  {message}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      {listError && (
        <p role="alert" className="text-body-sm font-medium text-destructive-strong">
          {errorText(listError)}
        </p>
      )}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="self-start"
        disabled={rows.fields.length >= max}
        // Field arrays of `{ value }` rows; the cast is the price of a generic path.
        onClick={() => rows.append({ value: "" } as never)}
      >
        <PlusIcon aria-hidden />
        {addLabel}
      </Button>
    </fieldset>
  );
}
