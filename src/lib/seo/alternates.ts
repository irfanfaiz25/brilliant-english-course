import type { Metadata } from "next";

import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

type Href = Parameters<typeof getPathname>[0]["href"];

/**
 * Canonical URL and hreflang alternates for a localized route (AGENTS.md § 4 SEO).
 * Paths are relative; `metadataBase` in the root layout turns them into absolute URLs.
 */
export function localizedAlternates(
  href: Href,
  locale: Locale,
): NonNullable<Metadata["alternates"]> {
  const pathFor = (target: Locale) => getPathname({ href, locale: target });

  return {
    canonical: pathFor(locale),
    languages: {
      ...Object.fromEntries(routing.locales.map((target) => [target, pathFor(target)])),
      "x-default": pathFor(routing.defaultLocale),
    },
  };
}
