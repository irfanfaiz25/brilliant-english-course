"use client";

import { ChevronDownIcon, RotateCcwIcon } from "lucide-react";

import { useUrlState } from "@/components/site/url-state-shell";
import { fieldControlClass } from "@/components/ui/input-styles";
import { cn } from "@/lib/utils";

export type RegionLevelField = {
  /** Level key, used for ids. */
  key: string;
  label: string;
  options: readonly { code: string; name: string }[];
  /** Selected code at this level, if any. */
  value: string | null;
  /** Code to fall back to when "All" is chosen (the parent level's selection). */
  parentCode: string | null;
  /** Shown as the placeholder when the level is not available yet. */
  disabledHint?: string;
};

type RegionFilterProps = {
  action: string;
  fields: readonly RegionLevelField[];
  /** Params to keep when the region changes (search text). */
  keep: Record<string, string>;
  labels: { title: string; all: string; apply: string; reset: string };
  idPrefix: string;
  /** Called after a change, e.g. to keep a mobile sheet open or closed. */
  onChange?: () => void;
};

/**
 * Province → regency → district → village cascade with native selects (best on phones: the OS
 * picker), shared by the unit finder and the partnership quota checker; must sit inside a
 * `UrlStateShell`. Each change applies immediately; lower levels reset and their options come from the
 * server for the new parent. Without JS it is a GET form with an Apply button.
 */
export function RegionFilter({
  action,
  fields,
  keep,
  labels,
  idPrefix,
  onChange,
}: RegionFilterProps) {
  const { navigate } = useUrlState();
  const hasSelection = fields.some((field) => field.value);

  const select = (field: RegionLevelField, code: string) => {
    const wilayah = code || field.parentCode;
    navigate(wilayah ? { ...keep, wilayah } : keep);
    onChange?.();
  };

  return (
    <form action={action} method="get" className="flex flex-col gap-4">
      {Object.entries(keep).map(([name, keptValue]) => (
        <input key={name} type="hidden" name={name} value={keptValue} />
      ))}
      <div className="flex items-center justify-between">
        <p className="text-overline text-muted-foreground uppercase">{labels.title}</p>
        {hasSelection && (
          <button
            type="button"
            onClick={() => {
              navigate(keep);
              onChange?.();
            }}
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-caption font-semibold text-primary transition-colors duration-(--duration-fast) hover:bg-primary-soft"
          >
            <RotateCcwIcon aria-hidden className="size-3.5" />
            {labels.reset}
          </button>
        )}
      </div>

      {fields.map((field) => {
        const id = `${idPrefix}-${field.key}`;
        const disabled = field.options.length === 0;
        return (
          <div key={field.key} className="flex flex-col gap-1.5">
            <label
              htmlFor={id}
              className={cn("text-label text-foreground", disabled && "text-muted-foreground")}
            >
              {field.label}
            </label>
            <div className="relative">
              <select
                id={id}
                name="wilayah"
                disabled={disabled}
                value={field.value ?? ""}
                onChange={(event) => select(field, event.target.value)}
                className={cn(
                  fieldControlClass,
                  "h-12 cursor-pointer appearance-none pr-10 disabled:cursor-not-allowed",
                  field.value && "border-primary/40 bg-primary-soft/40",
                )}
              >
                <option value="">
                  {disabled ? (field.disabledHint ?? labels.all) : labels.all}
                </option>
                {field.options.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-3.5 size-5 -translate-y-1/2 text-muted-foreground"
              />
            </div>
          </div>
        );
      })}

      <noscript>
        <button
          type="submit"
          className="h-11 w-full rounded-md bg-primary text-button text-primary-foreground"
        >
          {labels.apply}
        </button>
      </noscript>
    </form>
  );
}
