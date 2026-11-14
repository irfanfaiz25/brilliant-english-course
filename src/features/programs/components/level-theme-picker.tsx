"use client";

import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UseFormRegisterReturn } from "react-hook-form";

import { cn } from "@/lib/utils";

import { levelTheme } from "../level-theme";
import { levelThemes } from "../schema";

type LevelThemePickerProps = {
  /** `form.register("theme")`: every option is a native radio, so arrow keys move the choice. */
  field: UseFormRegisterReturn<"theme">;
  error?: string;
};

/** The fixed BEC palette a level is drawn in, as labelled swatches (name and color, never color alone). */
export function LevelThemePicker({ field, error }: LevelThemePickerProps) {
  const t = useTranslations("AdminPrograms.fields");

  return (
    <fieldset className="flex flex-col gap-3" aria-describedby="level-theme-hint">
      <legend className="mb-1 text-label text-foreground">{t("theme")}</legend>
      <p id="level-theme-hint" className="-mt-2 text-body-sm text-muted-foreground">
        {t("themeHint")}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {levelThemes.map((theme) => (
          <label
            key={theme}
            className={cn(
              "group flex h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-background/60 px-3 text-body-sm font-semibold text-foreground transition-colors duration-(--duration-fast)",
              "hover:border-primary/60 has-checked:border-transparent has-checked:ring-2 has-checked:ring-ring",
              "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
              levelTheme[theme].soft,
            )}
          >
            <input type="radio" value={theme} {...field} className="sr-only" />
            <span
              aria-hidden
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-white shadow-sm",
                levelTheme[theme].swatch,
              )}
            >
              <CheckIcon className="size-3.5 opacity-0 group-has-checked:opacity-100" />
            </span>
            {t(`themes.${theme}`)}
          </label>
        ))}
      </div>
      {error && <p className="text-body-sm text-destructive-strong">{error}</p>}
    </fieldset>
  );
}
