"use client";

import { ChevronDownIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import {
  get,
  useFieldArray,
  useWatch,
  type ArrayPath,
  type FieldArray,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

import { Sortable } from "./sortable";
import { useFormErrorText } from "./use-form-error-text";

type ItemListFieldProps<TValues extends FieldValues, TName extends ArrayPath<TValues>> = {
  form: UseFormReturn<TValues, unknown, unknown>;
  /** Field array of items with `texts.<locale>.title` and `texts.<locale>.text`. */
  name: TName;
  /** Accessible name of item `index` (1-based) while its title is empty, e.g. "Keuntungan 2". */
  itemLabel: (index: number) => string;
  addLabel: string;
  min: number;
  max: number;
  titleMax: number;
  textMax: number;
  /** A blank item to append. */
  newItem: () => FieldArray<TValues, TName>;
  /** Fields shared by both locales (icon, photo, group …), shown above the copy. */
  renderShared?: (index: number) => ReactNode;
  /** A small preview at the start of the row header, e.g. the item's icon. */
  renderBadge?: (index: number) => ReactNode;
  disabled?: boolean;
};

const localeNames: Record<Locale, "localeId" | "localeEn"> = { id: "localeId", en: "localeEn" };

/**
 * An admin list of content items (ADR-041): rows dragged into order (`Sortable`), each a card that
 * folds to its title. The copy sits side by side per locale (Indonesian | English), so translating
 * means reading across and no error hides on another tab. Rows with errors, and new rows without a
 * title yet, stay open.
 */
export function ItemListField<TValues extends FieldValues, TName extends ArrayPath<TValues>>({
  form,
  name,
  itemLabel,
  addLabel,
  min,
  max,
  titleMax,
  textMax,
  newItem,
  renderShared,
  renderBadge,
  disabled = false,
}: ItemListFieldProps<TValues, TName>) {
  const t = useTranslations("AdminForms.itemList");
  const tForms = useTranslations("AdminForms");
  const errorText = useFormErrorText();
  const rows = useFieldArray({ control: form.control, name, keyName: "key" as const });
  const values = useWatch({ control: form.control, name: name as unknown as Path<TValues> }) as
    { texts?: Record<Locale, { title?: string }> }[] | undefined;
  const errors = get(form.formState.errors, name) as
    (Record<number, unknown> & { root?: { message?: string }; message?: string }) | undefined;
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());

  const titleOf = (index: number) =>
    values?.[index]?.texts?.[routing.defaultLocale]?.title?.trim() || itemLabel(index + 1);
  const toggle = (key: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const field = (index: number, locale: Locale, part: "title" | "text") =>
    `${name}.${index}.texts.${locale}.${part}` as Path<TValues>;
  const listError = errors?.root?.message ?? errors?.message;

  return (
    <div className="flex flex-col gap-3">
      <Sortable
        values={rows.fields.map((row) => row.key)}
        onReorder={(order, moved) => {
          const from = rows.fields.findIndex((row) => row.key === moved);
          rows.move(from, order.indexOf(moved));
        }}
        itemLabel={(key) => titleOf(rows.fields.findIndex((row) => row.key === key))}
        disabled={disabled || rows.fields.length < 2}
        className="flex flex-col gap-2.5"
        itemClassName="items-start"
      >
        {(key) => {
          const index = rows.fields.findIndex((row) => row.key === key);
          const invalid = errors?.[index] !== undefined;
          // A row with an error, or one still without a title (just added), stays open.
          const untitled = !values?.[index]?.texts?.[routing.defaultLocale]?.title?.trim();
          const expanded = open.has(key) || invalid || untitled;
          const bodyId = `${String(name)}-${key}`;
          return (
            <div
              className={cn(
                "rounded-xl border bg-background transition-colors duration-(--duration-fast)",
                invalid ? "border-destructive/60" : "border-border/70",
              )}
            >
              <div className="flex items-center gap-2 p-2 pl-3">
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  aria-expanded={expanded}
                  aria-controls={bodyId}
                  className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-caption font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                  {renderBadge?.(index)}
                  <span className="min-w-0 flex-1 truncate text-body-sm font-semibold text-foreground">
                    {titleOf(index)}
                  </span>
                  <ChevronDownIcon
                    aria-hidden
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-fast)",
                      expanded && "rotate-180",
                    )}
                  />
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => rows.remove(index)}
                  disabled={disabled || rows.fields.length <= min}
                  aria-label={tForms("removeItem", { item: titleOf(index) })}
                >
                  <Trash2Icon aria-hidden />
                </Button>
              </div>
              {/* Kept mounted while folded, so the form keeps every value and validates it. */}
              <div
                id={bodyId}
                hidden={!expanded}
                className="flex flex-col gap-4 border-t border-border/60 p-4"
              >
                {renderShared?.(index)}
                <div className="grid gap-4 lg:grid-cols-2">
                  {routing.locales.map((locale) => (
                    <fieldset key={locale} className="flex flex-col gap-3">
                      <legend className="mb-1 text-overline text-muted-foreground uppercase">
                        {t(localeNames[locale])}
                      </legend>
                      <Field
                        label={t("title")}
                        error={errorText(
                          (
                            get(form.formState.errors, field(index, locale, "title")) as
                              { message?: string } | undefined
                          )?.message,
                        )}
                        required
                      >
                        {(control) => (
                          <Input
                            {...control}
                            {...form.register(field(index, locale, "title"))}
                            maxLength={titleMax}
                          />
                        )}
                      </Field>
                      <Field
                        label={t("text")}
                        error={errorText(
                          (
                            get(form.formState.errors, field(index, locale, "text")) as
                              { message?: string } | undefined
                          )?.message,
                        )}
                      >
                        {(control) => (
                          <Textarea
                            {...control}
                            {...form.register(field(index, locale, "text"))}
                            rows={2}
                            maxLength={textMax}
                            className="min-h-20"
                          />
                        )}
                      </Field>
                    </fieldset>
                  ))}
                </div>
              </div>
            </div>
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
        onClick={() => rows.append(newItem())}
      >
        <PlusIcon aria-hidden />
        {addLabel}
      </Button>
    </div>
  );
}
