"use client";

import { LoaderCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";

import { NativeSelect } from "@/components/admin/native-select";
import { cn } from "@/lib/utils";

import { loadRegionChildren } from "../actions";
import type { RegionPickerLevel } from "../picker";
import { regionLevels, type Region } from "../schema";

type RegionPickerProps = {
  /** First render: options and selection of every level (`getRegionPickerLevels`). */
  initialLevels: readonly RegionPickerLevel[];
  /**
   * Called with the village code once a village is chosen, or "" when the choice is undone, plus
   * the chosen regions from the province down (for labels such as "Kec. X, Kab. Y").
   */
  onChange: (villageCode: string, path: Region[]) => void;
  /** Error under the village select (e.g. "villageRequired"), already translated. */
  error?: string;
  disabled?: boolean;
  /** Two columns from `sm` (forms); one column in narrow places. */
  columns?: 1 | 2;
};

/**
 * Province → regency → district → village cascade for admin forms. Choosing a level clears the
 * levels below and loads the next one's options from the server (cached reference data).
 */
export function RegionPicker({
  initialLevels,
  onChange,
  error,
  disabled = false,
  columns = 2,
}: RegionPickerProps) {
  const t = useTranslations("Regions");
  const id = useId();
  const [levels, setLevels] = useState(initialLevels);
  const [loadingLevel, setLoadingLevel] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const villageIndex = regionLevels.length - 1;

  const choose = (index: number, code: string) => {
    const path = levels.flatMap((level, at) => {
      const selected = at === index ? code : at < index ? level.value : "";
      const option = level.options.find((candidate) => candidate.code === selected);
      return option ? [option] : [];
    });
    setLevels((current) =>
      current.map((level, at) => {
        if (at < index) return level;
        if (at === index) return { ...level, value: code };
        // Below the change: nothing chosen, and no options until the parent is loaded.
        return { ...level, value: "", options: [] };
      }),
    );
    onChange(index === villageIndex ? code : "", path);
    if (!code || index === villageIndex) return;

    setLoadingLevel(index + 1);
    startTransition(async () => {
      const children = await loadRegionChildren(code);
      setLevels((current) =>
        current.map((level, at) => (at === index + 1 ? { ...level, options: children } : level)),
      );
      setLoadingLevel(null);
    });
  };

  return (
    <div className={cn("grid gap-4", columns === 2 && "sm:grid-cols-2")}>
      {levels.map((level, index) => {
        const selectId = `${id}-${level.level}`;
        const errorId = `${selectId}-error`;
        const isVillage = index === villageIndex;
        const parentLevel = regionLevels[index - 1];
        const unavailable = level.options.length === 0;
        return (
          <div key={level.level} className="flex flex-col gap-2">
            <label
              htmlFor={selectId}
              className="flex items-center gap-2 text-label text-foreground"
            >
              {t(level.level)}
              {isVillage && (
                <span aria-hidden className="text-destructive">
                  *
                </span>
              )}
              {loadingLevel === index && (
                <LoaderCircleIcon
                  aria-hidden
                  className="size-4 animate-spin text-muted-foreground motion-reduce:animate-none"
                />
              )}
            </label>
            <NativeSelect
              id={selectId}
              value={level.value}
              disabled={disabled || unavailable}
              aria-required={isVillage || undefined}
              aria-invalid={isVillage && error ? true : undefined}
              aria-describedby={isVillage && error ? errorId : undefined}
              aria-busy={loadingLevel === index || undefined}
              onChange={(event) => choose(index, event.target.value)}
              className={cn(level.value && "border-primary/40 bg-primary-soft/40")}
            >
              <option value="">
                {unavailable && parentLevel
                  ? t("chooseParentFirst", { parent: t(parentLevel).toLowerCase() })
                  : t("choose", { level: t(level.level).toLowerCase() })}
              </option>
              {level.options.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name}
                </option>
              ))}
            </NativeSelect>
            {isVillage && error && (
              <p
                id={errorId}
                role="alert"
                className="text-body-sm font-medium text-destructive-strong"
              >
                {error}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
