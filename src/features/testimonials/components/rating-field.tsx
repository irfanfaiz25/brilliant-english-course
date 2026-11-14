"use client";

import { StarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";

import { cn } from "@/lib/utils";

const RATINGS = [1, 2, 3, 4, 5] as const;

type RatingFieldProps = {
  value: number;
  onChange: (rating: number) => void;
  label: string;
  error?: string;
};

/**
 * Star rating as a native radio group: arrow keys move between stars, each star is announced as
 * "n bintang", and the stars up to the choice are filled like on the public card.
 */
export function RatingField({ value, onChange, label, error }: RatingFieldProps) {
  const t = useTranslations("AdminTestimonials");
  const name = useId();
  const errorId = `${name}-error`;

  return (
    <fieldset
      aria-describedby={error ? errorId : undefined}
      className="flex min-w-0 flex-col gap-2"
    >
      <legend className="mb-2 text-label text-foreground">
        {label}
        <span aria-hidden className="ml-1 text-destructive">
          *
        </span>
      </legend>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="flex gap-1">
          {RATINGS.map((rating) => (
            <label key={rating} className="cursor-pointer">
              <input
                type="radio"
                name={name}
                value={rating}
                checked={value === rating}
                onChange={() => onChange(rating)}
                className="peer sr-only"
              />
              <span className="sr-only">{t("fields.ratingOption", { count: rating })}</span>
              <StarIcon
                aria-hidden
                className={cn(
                  "size-9 rounded-md p-1 transition-colors duration-(--duration-fast)",
                  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-ring",
                  rating <= value
                    ? "fill-current text-highlight"
                    : "text-muted-foreground/50 hover:text-highlight",
                )}
              />
            </label>
          ))}
        </div>
        <span aria-hidden className="text-body-sm whitespace-nowrap text-muted-foreground">
          {value >= 1 ? t("rating", { rating: value }) : null}
        </span>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-body-sm font-medium text-destructive-strong">
          {error}
        </p>
      )}
    </fieldset>
  );
}
