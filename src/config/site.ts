/**
 * Static site identity used as code defaults. Values editable by admins (contact, social links,
 * SEO overrides) move to the `settings` domain in Phase 4 and fall back to these.
 * Locale settings live in `src/i18n/routing.ts`.
 */
export const siteConfig = {
  name: "Brilliant English Course",
  shortName: "BEC",
  logo: {
    src: "/brand/logo-bec.webp",
    /** PNG fallback for consumers without WebP support (emails, some crawlers). */
    fallbackSrc: "/brand/logo-bec.png",
    width: 384,
    height: 371,
  },
} as const;
