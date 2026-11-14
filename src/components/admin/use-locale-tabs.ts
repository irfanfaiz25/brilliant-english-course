"use client";

import { useState } from "react";
import type { FieldErrors, FieldValues } from "react-hook-form";

import { routing, type Locale } from "@/i18n/routing";

type TextErrors = { texts?: Partial<Record<Locale, unknown>> };

const localesWithErrors = (errors: TextErrors) =>
  routing.locales.filter((locale) => errors.texts?.[locale] !== undefined);

/**
 * Tab state for a form with `texts.<locale>` fields: which locales have errors (tab dots) and a
 * handler for failed saves that opens the first invalid locale and focuses its first invalid
 * field, so the error is never left on a hidden tab.
 */
export function useLocaleTabs<TValues extends FieldValues>(errors: FieldErrors<TValues>) {
  const [locale, setLocale] = useState<Locale>(routing.defaultLocale);
  const invalid = localesWithErrors(errors as TextErrors);

  const showInvalid = (next: FieldErrors<TValues>) => {
    const failing = localesWithErrors(next as TextErrors);
    // Non-text fields come first in every form; React Hook Form already focuses those.
    if (Object.keys(next).some((key) => key !== "texts")) return;
    const target = failing.includes(locale) ? locale : failing[0];
    if (!target) return;
    setLocale(target);
    requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(`[data-locale-panel="${target}"] [aria-invalid="true"]`)
        ?.focus();
    });
  };

  return { locale, setLocale, invalid, showInvalid };
}
