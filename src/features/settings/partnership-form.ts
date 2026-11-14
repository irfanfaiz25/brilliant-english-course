import type { PartnershipSetting } from "@/features/partners/schema";
import type { Locale } from "@/i18n/routing";

/*
 * The partnership form edits one investment for both locales and the inclusions as rows (field
 * arrays need objects). These helpers convert between that shape and the `partnership` setting,
 * which stays validated by its own schema on both sides.
 */

export type PartnershipFormValues = {
  /** Digits only; empty = explained during the consultation. */
  investment: string;
  inclusions: Record<Locale, { value: string }[]>;
};

export function toPartnershipFormValues(setting: PartnershipSetting): PartnershipFormValues {
  return {
    investment: setting.id.investment?.toString() ?? "",
    inclusions: {
      id: setting.id.inclusions.map((value) => ({ value })),
      en: setting.en.inclusions.map((value) => ({ value })),
    },
  };
}

/** The setting to validate and store. Anything but digits becomes `NaN`, which the schema rejects. */
export function toPartnershipSetting(values: PartnershipFormValues): unknown {
  const raw = values.investment.trim();
  const investment = raw === "" ? null : /^\d+$/.test(raw) ? Number(raw) : Number.NaN;
  const pick = (locale: Locale) => ({
    investment,
    inclusions: values.inclusions[locale].map((row) => row.value),
  });
  return { id: pick("id"), en: pick("en") };
}

/** Maps an error path of the setting (`en.inclusions.2`) to the form field it belongs to. */
export function partnershipFieldName(path: string): string {
  const [locale, field, index] = path.split(".");
  if (field === "investment") return "investment";
  if (field === "inclusions") {
    return index === undefined
      ? `inclusions.${locale}.root`
      : `inclusions.${locale}.${index}.value`;
  }
  return path;
}

type FormErrors = Record<string, unknown>;

/** Nests `{ path, message }` issues into the error object React Hook Form expects. */
export function toPartnershipFormErrors(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): FormErrors {
  const errors: FormErrors = {};
  for (const issue of issues) {
    const keys = partnershipFieldName(issue.path.join(".")).split(".");
    let node = errors;
    for (const key of keys.slice(0, -1)) {
      node[key] ??= {};
      node = node[key] as FormErrors;
    }
    node[keys.at(-1) ?? ""] ??= { type: "validate", message: issue.message };
  }
  return errors;
}
