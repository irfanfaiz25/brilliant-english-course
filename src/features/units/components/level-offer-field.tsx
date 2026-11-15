"use client";

import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useController, type Control } from "react-hook-form";

import { useFormErrorText } from "@/components/admin/use-form-error-text";
import { levelTheme } from "@/features/programs/level-theme";
import { cn } from "@/lib/utils";

import type { UnitForm, UnitFormInput, UnitLevelOption } from "../schema";

type LevelOfferFieldProps = {
  control: Control<UnitFormInput, unknown, UnitForm>;
  levelOptions: readonly UnitLevelOption[];
};

const choice =
  "flex cursor-pointer items-center gap-2.5 rounded-lg border transition-colors duration-(--duration-fast) has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring";

/**
 * The levels a unit offers and, inside each, the classes it opens (ADR-040). Ticking a level
 * opens all its classes; unticking classes narrows it, and unticking the last one drops the level.
 * All classes ticked means the whole level, including classes added later.
 */
export function LevelOfferField({ control, levelOptions }: LevelOfferFieldProps) {
  const t = useTranslations("AdminUnits");
  const errorText = useFormErrorText();
  const levels = useController({ control, name: "levels" });
  const classes = useController({ control, name: "classIds" });
  const chosenLevels = levels.field.value;
  const chosenClasses = classes.field.value;

  // Kept in display order, whatever order things were ticked in.
  const setLevels = (slugs: ReadonlySet<string>) =>
    levels.field.onChange(
      levelOptions.map((level) => level.slug).filter((slug) => slugs.has(slug)),
    );

  const toggleLevel = (level: UnitLevelOption, on: boolean) => {
    const slugs = new Set(chosenLevels);
    const ids = new Set(chosenClasses);
    for (const item of level.classes) {
      if (on) ids.add(item.id);
      else ids.delete(item.id);
    }
    if (on) slugs.add(level.slug);
    else slugs.delete(level.slug);
    setLevels(slugs);
    classes.field.onChange([...ids]);
  };

  const toggleClass = (level: UnitLevelOption, classId: string, on: boolean) => {
    const ids = new Set(chosenClasses);
    if (on) ids.add(classId);
    else ids.delete(classId);
    classes.field.onChange([...ids]);
    if (!level.classes.some((item) => ids.has(item.id))) {
      setLevels(new Set(chosenLevels.filter((slug) => slug !== level.slug)));
    }
  };

  const error = levels.fieldState.error?.message ?? classes.fieldState.error?.message;

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-label text-foreground">{t("fields.levels")}</legend>
      <p className="text-body-sm text-muted-foreground">{t("fields.levelsHint")}</p>
      <ul className="flex flex-col gap-3">
        {levelOptions.map((level) => {
          const theme = levelTheme[level.theme];
          const offered = chosenLevels.includes(level.slug);
          const opened = level.classes.filter((item) => chosenClasses.includes(item.id));
          const whole = opened.length === level.classes.length;
          return (
            <li
              key={level.slug}
              className={cn(
                "flex flex-col gap-3 rounded-xl border p-3 transition-colors duration-(--duration-fast)",
                offered ? cn("border-transparent", theme.soft) : "border-border bg-background",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  className={cn(choice, "h-11 border-transparent px-1 text-body-sm font-semibold")}
                >
                  <input
                    type="checkbox"
                    checked={offered}
                    onChange={(event) => toggleLevel(level, event.target.checked)}
                    className="size-5 cursor-pointer accent-primary"
                  />
                  {level.name}
                </label>
                {offered && level.classes.length > 0 && (
                  <span className={cn("text-caption font-semibold", theme.accent)}>
                    {whole
                      ? t("fields.allClasses")
                      : t("fields.someClasses", {
                          count: opened.length,
                          total: level.classes.length,
                        })}
                  </span>
                )}
              </div>
              {offered && level.classes.length > 0 && (
                <fieldset className="flex flex-wrap gap-2">
                  <legend className="sr-only">
                    {t("fields.classesOf", { level: level.name })}
                  </legend>
                  {level.classes.map((item) => {
                    const checked = chosenClasses.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className={cn(
                          choice,
                          "min-h-11 px-3 py-1.5",
                          checked
                            ? "border-border bg-card shadow-sm"
                            : "border-dashed border-border/80 bg-transparent text-muted-foreground",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => toggleClass(level, item.id, event.target.checked)}
                          className="peer sr-only"
                        />
                        <span
                          aria-hidden
                          className={cn(
                            "inline-flex size-5 shrink-0 items-center justify-center rounded-md border",
                            checked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border",
                          )}
                        >
                          {checked && <CheckIcon className="size-3.5" />}
                        </span>
                        <span className="flex flex-col leading-tight">
                          <span className="text-body-sm font-semibold text-foreground">
                            {item.name}
                          </span>
                          <span className="text-caption text-muted-foreground">{item.grades}</span>
                        </span>
                      </label>
                    );
                  })}
                </fieldset>
              )}
            </li>
          );
        })}
      </ul>
      {error && (
        <p role="alert" className="text-body-sm font-medium text-destructive-strong">
          {errorText(error)}
        </p>
      )}
    </fieldset>
  );
}
