import { defineRouting } from "next-intl/routing";

import { locales } from "@/config/enums";

/**
 * Locale routing for the public site (ADR-005, ADR-012).
 *
 * - `id` is the default and has no URL prefix; English lives under `/en`.
 * - No automatic detection from `Accept-Language` or cookies: most parents use phones set to
 *   English, but the site's primary audience reads Indonesian. Visitors switch manually.
 * - Internal route folders use the Indonesian path; `pathnames` maps them to localized URLs.
 */
export const routing = defineRouting({
  locales,
  defaultLocale: "id",
  localePrefix: "as-needed",
  localeDetection: false,
  localeCookie: false,
  // hreflang alternates are emitted through page metadata (src/lib/seo), not response headers.
  alternateLinks: false,
  pathnames: {
    "/": "/",
    "/program": { id: "/program", en: "/programs" },
    "/cek-unit": { id: "/cek-unit", en: "/find-a-unit" },
    "/unit": { id: "/unit", en: "/units" },
    "/unit/[...path]": { id: "/unit/[...path]", en: "/units/[...path]" },
    "/kemitraan": { id: "/kemitraan", en: "/partnership" },
    "/blog": "/blog",
    "/blog/[slug]": "/blog/[slug]",
    "/kontak": { id: "/kontak", en: "/contact" },
  },
});

export type Locale = (typeof routing.locales)[number];
export type AppPathname = keyof typeof routing.pathnames;
/** Routes without dynamic segments; these can be linked to without `params`. */
export type StaticPathname = Exclude<AppPathname, `${string}[${string}]${string}`>;

/** Open Graph / BCP 47 region tags per locale. */
export const localeRegion = {
  id: "id_ID",
  en: "en_US",
} as const satisfies Record<Locale, string>;
