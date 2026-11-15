"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Controller,
  get,
  useFieldArray,
  type ArrayPath,
  type FieldArray,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { MediaOption } from "@/features/media/admin-queries";
import { routing, type Locale } from "@/i18n/routing";

import { MediaPicker } from "./media-picker";
import { Sortable } from "./sortable";
import { useFormErrorText } from "./use-form-error-text";

type PhotoListFieldProps<TValues extends FieldValues, TName extends ArrayPath<TValues>> = {
  form: UseFormReturn<TValues, unknown, unknown>;
  /** Field array of `{ imageId, caption: { id, en } }` rows. */
  name: TName;
  mediaOptions: readonly MediaOption[];
  canUpload: boolean;
  max: number;
  captionMax: number;
  disabled?: boolean;
};

const captionLabels: Record<Locale, "captionId" | "captionEn"> = {
  id: "captionId",
  en: "captionEn",
};

/**
 * A gallery edited in admin: photos from the media library with an optional caption per locale,
 * dragged into order (`Sortable`; the first is the large one). A row without a photo is refused on
 * save (`imageRequired`), on its own picker.
 */
export function PhotoListField<TValues extends FieldValues, TName extends ArrayPath<TValues>>({
  form,
  name,
  mediaOptions,
  canUpload,
  max,
  captionMax,
  disabled = false,
}: PhotoListFieldProps<TValues, TName>) {
  const t = useTranslations("AdminForms.photoList");
  const errorText = useFormErrorText();
  const rows = useFieldArray({ control: form.control, name, keyName: "key" as const });
  const path = (index: number, rest: string) => `${name}.${index}.${rest}` as Path<TValues>;
  const listError = (
    get(form.formState.errors, name) as
      { root?: { message?: string }; message?: string } | undefined
  )?.root?.message;

  return (
    <div className="flex flex-col gap-3">
      {rows.fields.length === 0 && (
        <p className="rounded-xl bg-surface px-4 py-5 text-body-sm text-muted-foreground">
          {t("empty")}
        </p>
      )}
      <Sortable
        values={rows.fields.map((row) => row.key)}
        onReorder={(order, moved) => {
          const from = rows.fields.findIndex((row) => row.key === moved);
          rows.move(from, order.indexOf(moved));
        }}
        itemLabel={(key) =>
          t("item", { index: rows.fields.findIndex((row) => row.key === key) + 1 })
        }
        disabled={disabled || rows.fields.length < 2}
        className="flex flex-col gap-2.5"
        itemClassName="items-start"
      >
        {(key) => {
          const index = rows.fields.findIndex((row) => row.key === key);
          return (
            <fieldset className="flex flex-col gap-4 rounded-xl border border-border/70 bg-background p-4">
              <legend className="sr-only">{t("item", { index: index + 1 })}</legend>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <Controller
                    control={form.control}
                    name={path(index, "imageId")}
                    render={({ field, fieldState }) => (
                      <MediaPicker
                        value={String(field.value ?? "")}
                        onChange={field.onChange}
                        options={mediaOptions}
                        canUpload={canUpload}
                        label={index === 0 ? t("lead") : t("item", { index: index + 1 })}
                        error={errorText(fieldState.error?.message)}
                        disabled={disabled}
                      />
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="mt-7"
                  onClick={() => rows.remove(index)}
                  disabled={disabled}
                  aria-label={t("remove", { index: index + 1 })}
                >
                  <Trash2Icon aria-hidden />
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {routing.locales.map((locale) => (
                  <Field
                    key={locale}
                    label={t(captionLabels[locale])}
                    error={errorText(
                      (
                        get(form.formState.errors, path(index, `caption.${locale}`)) as
                          { message?: string } | undefined
                      )?.message,
                    )}
                  >
                    {(control) => (
                      <Input
                        {...control}
                        {...form.register(path(index, `caption.${locale}`))}
                        maxLength={captionMax}
                        placeholder={t("captionPlaceholder")}
                      />
                    )}
                  </Field>
                ))}
              </div>
            </fieldset>
          );
        }}
      </Sortable>
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
        disabled={disabled || rows.fields.length >= max}
        onClick={() =>
          rows.append({ imageId: "", caption: { id: "", en: "" } } as FieldArray<TValues, TName>)
        }
      >
        <PlusIcon aria-hidden />
        {t("add")}
      </Button>
    </div>
  );
}
