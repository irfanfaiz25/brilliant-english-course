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
  // PLACEHOLDER contact details until admin settings land (Phase 4a). Replace with real values.
  contact: {
    whatsapp: "6281200000000",
    email: "halo@beccourses.com",
    address: "Kab. Bogor, Jawa Barat",
  },
  // PLACEHOLDER social profiles (Phase 4a).
  social: {
    instagram: "https://www.instagram.com/",
    facebook: "https://www.facebook.com/",
    youtube: "https://www.youtube.com/",
    tiktok: "https://www.tiktok.com/",
  },
} as const;

export type SocialNetwork = keyof typeof siteConfig.social;
