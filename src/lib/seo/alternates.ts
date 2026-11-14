import type { Metadata } from "next";

import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

type Href = Parameters<typeof getPathname>[0]["href"];

/**
 * Canonical URL and hreflang alternates for a localized route (AGENTS.md § 4 SEO).
 * Paths are relative; `metadataBase` in the root layout turns them into absolute URLs.
 * Pass a function when params differ per locale (localized blog slugs); it returns `null` for a
 * locale the page does not exist in (a post without English), which is then left out.
 */
export function localizedAlternates(
  href: Href | ((target: Locale) => Href | null),
  locale: Locale,
): NonNullable<Metadata["alternates"]> {
  const pathFor = (target: Locale) => {
    const targetHref = typeof href === "function" ? href(target) : href;
    return targetHref === null ? null : getPathname({ href: targetHref, locale: target });
  };
  const languages = routing.locales.flatMap((target) => {
    const path = pathFor(target);
    return path === null ? [] : [[target, path] as const];
  });
  const fallback = pathFor(routing.defaultLocale);

  return {
    canonical: pathFor(locale),
    languages: {
      ...Object.fromEntries(languages),
      ...(fallback === null ? {} : { "x-default": fallback }),
    },
  };
}
