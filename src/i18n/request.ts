import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { locale as rootLocale } from "next/root-params";

import { routing } from "./routing";

/**
 * Resolves the locale and messages for each server request.
 *
 * The locale comes from an explicit override (e.g. `getTranslations({ locale })` in Server
 * Actions, where root params are unavailable) or from the `[locale]` root segment.
 * Anything else (admin, unknown values) falls back to the default locale.
 */
export default getRequestConfig(async ({ locale: explicitLocale }) => {
  const requested = explicitLocale ?? (await rootLocale());
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
