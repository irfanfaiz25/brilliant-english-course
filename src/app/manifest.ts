import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { brandColors } from "@/lib/design-tokens";

/**
 * Web app manifest (`/manifest.webmanifest`): the name and icons used when the site is added to a
 * phone's home screen. Browser tab icons are `favicon.ico`, `icon.png` and `apple-icon.png` next to
 * this file (Next.js metadata conventions).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    start_url: "/",
    display: "standalone",
    background_color: brandColors.white,
    theme_color: brandColors.teal500,
    icons: [
      { src: "/icons/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
