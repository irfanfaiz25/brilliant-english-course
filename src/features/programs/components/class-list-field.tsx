"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFieldArray, type UseFormReturn } from "react-hook-form";

import { NativeSelect } from "@/components/admin/native-select";
import { Sortable } from "@/components/admin/sortable";
import { useFormErrorText } from "@/components/admin/use-form-error-text";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { limits } from "@/config/limits";

import { formatGrade, gradeLabelKeys, type GradeLabels } from "../grades";
import { schoolGrades, type LevelForm, type LevelFormInput } from "../schema";

const L = limits.programs;

type ClassListFieldProps = {
  form: UseFormReturn<LevelFormInput, unknown, LevelForm>;
  /** Classes a unit opened by name: they cannot be removed here (ADR-040). */
  classesInUse: readonly string[];
};

/** The `Grades` templates, read once for the grade selects. */
export function useGradeLabels(): GradeLabels {
  const t = useTranslations("Grades");
  return Object.fromEntries(
    gradeLabelKeys.map((key) => [key, t.raw(key) as string]),
  ) as GradeLabels;
}

/**
 * The classes inside a level, in teaching order: name, school-year span and an optional focus
 * line per locale. Rows are dragged into order like other form lists (`Sortable`); a class a unit
 * opened keeps its delete button disabled.
 */
export function ClassListField({ form, classesInUse }: ClassListFieldProps) {
  const t = useTranslations("AdminPrograms.classes");
  const errorText = useFormErrorText();
  const grades = useGradeLabels();
  const rows = useFieldArray({ control: form.control, name: "classes", keyName: "key" });
  const errors = form.formState.errors.classes;
  const listError = errors?.root?.message ?? errors?.message;
  const nameOf = (index: number) =>
    form.getValues(`classes.${index}.name`)?.trim() || t("item", { index: index + 1 });

  return (
    <div className="flex flex-col gap-4">
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
        itemLabel={(key) => nameOf(rows.fields.findIndex((row) => row.key === key))}
        disabled={rows.fields.length < 2}
        className="flex flex-col gap-3"
        itemClassName="items-start"
      >
        {(key) => {
          const index = rows.fields.findIndex((row) => row.key === key);
          const row = rows.fields[index];
          const rowErrors = errors?.[index];
          const inUse = Boolean(row?.classId && classesInUse.includes(row.classId));
          return (
            <fieldset className="flex flex-col gap-4 rounded-xl border border-border/70 bg-background p-4">
              <legend className="sr-only">{nameOf(index)}</legend>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start">
                <Field label={t("name")} error={errorText(rowErrors?.name?.message)} required>
                  {(control) => (
                    <Input
                      {...control}
                      {...form.register(`classes.${index}.name`)}
                      maxLength={L.classNameMax}
                      placeholder={t("namePlaceholder")}
                    />
                  )}
                </Field>
                <Field label={t("gradeFrom")} required>
                  {(control) => (
                    <NativeSelect {...control} {...form.register(`classes.${index}.gradeFrom`)}>
                      {schoolGrades.map((grade) => (
                        <option key={grade} value={grade}>
                          {formatGrade(grade, grades)}
                        </option>
                      ))}
                    </NativeSelect>
                  )}
                </Field>
                <Field label={t("gradeTo")} error={errorText(rowErrors?.gradeTo?.message)} required>
                  {(control) => (
                    <NativeSelect {...control} {...form.register(`classes.${index}.gradeTo`)}>
                      {schoolGrades.map((grade) => (
                        <option key={grade} value={grade}>
                          {formatGrade(grade, grades)}
                        </option>
                      ))}
                    </NativeSelect>
                  )}
                </Field>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="sm:mt-9"
                  onClick={() => rows.remove(index)}
                  disabled={inUse}
                  title={inUse ? t("inUse") : undefined}
                  aria-label={t("remove", { name: nameOf(index) })}
                >
                  <Trash2Icon aria-hidden />
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t("focusId")} error={errorText(rowErrors?.focus?.id?.message)}>
                  {(control) => (
                    <Input
                      {...control}
                      {...form.register(`classes.${index}.focus.id`)}
                      maxLength={L.classFocusMax}
                    />
                  )}
                </Field>
                <Field label={t("focusEn")} error={errorText(rowErrors?.focus?.en?.message)}>
                  {(control) => (
                    <Input
                      {...control}
                      {...form.register(`classes.${index}.focus.en`)}
                      maxLength={L.classFocusMax}
                    />
                  )}
                </Field>
              </div>
              {inUse && <p className="text-caption text-muted-foreground">{t("inUse")}</p>}
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
        disabled={rows.fields.length >= L.classesMax}
        onClick={() =>
          rows.append({
            classId: "",
            name: "",
            gradeFrom: "sd1",
            gradeTo: "sd1",
            focus: { id: "", en: "" },
          })
        }
      >
        <PlusIcon aria-hidden />
        {t("add")}
      </Button>
    </div>
  );
}
