"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

type WeekdayPickerProps = {
  /** ISO weekdays (1 = Monday … 7 = Sunday). */
  value: readonly number[];
  onChange: (days: number[]) => void;
  label: string;
  error?: string;
  disabled?: boolean;
};

/**
 * Toggle buttons for the days of the week (office hours, unit schedules). Each button says the
 * full day name to screen readers and keeps the selection sorted Monday first.
 */
export function WeekdayPicker({ value, onChange, label, error, disabled }: WeekdayPickerProps) {
  const t = useTranslations("AdminForms");
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2">
      <span aria-hidden className="text-label text-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {WEEKDAYS.map((day) => {
          const selected = value.includes(day);
          return (
            <button
              key={day}
              type="button"
              aria-pressed={selected}
              aria-label={t(`weekdaysLong.${day}`)}
              disabled={disabled}
              onClick={() =>
                onChange(
                  selected
                    ? value.filter((other) => other !== day)
                    : [...value, day].sort((a, b) => a - b),
                )
              }
              className={cn(
                "h-11 min-w-11 rounded-lg border px-2 text-body-sm font-semibold transition-colors duration-(--duration-fast)",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                "disabled:cursor-not-allowed disabled:opacity-60",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:border-primary/60",
              )}
            >
              {t(`weekdays.${day}`)}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="text-body-sm font-medium text-destructive-strong">
          {error}
        </p>
      )}
    </div>
  );
}
