"use client";

import { useTranslations } from "next-intl";

import { limits } from "@/config/limits";

/** Values the error messages may mention (`{max}`, `{min}`), filled per code. */
const errorValues: Record<string, Record<string, number>> = {
  addressTooLong: { max: limits.settings.addressMax },
  inclusionTooLong: { max: limits.settings.inclusionMax },
  inclusionsTooFew: { min: limits.settings.inclusionsMin },
  inclusionsTooMany: { max: limits.settings.inclusionsMax },
  titleTooLong: { max: limits.seo.titleMax },
  descriptionTooShort: { min: limits.seo.descriptionMin },
  descriptionTooLong: { max: limits.seo.descriptionMax },
};

type ErrorCode = Parameters<ReturnType<typeof useTranslations<"AdminForms.errors">>>[0];

/**
 * Translates a validation or action code from `AdminForms.errors`. Codes come from the shared Zod
 * schemas, so an unknown one (e.g. a built-in Zod message) falls back to the generic "invalid".
 */
export function useFormErrorText() {
  const t = useTranslations("AdminForms.errors");
  return (code: string | undefined): string | undefined => {
    if (!code) return undefined;
    if (!t.has(code as ErrorCode)) return t("invalid");
    return t(code as ErrorCode, errorValues[code]);
  };
}
