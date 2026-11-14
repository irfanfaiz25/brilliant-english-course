/**
 * Static site identity. Admin-editable values (contact details, social links, SEO) live in the
 * `settings` and `seo` domains with code defaults there. Locale settings live in
 * `src/i18n/routing.ts`.
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

/** Social networks the site links to; their URLs are part of the `contact` setting. */
export const socialNetworks = ["instagram", "facebook", "youtube", "tiktok"] as const;
export type SocialNetwork = (typeof socialNetworks)[number];

/** Display names of the social networks (brand names, not translated). */
export const socialNetworkNames: Record<SocialNetwork, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  tiktok: "TikTok",
};
