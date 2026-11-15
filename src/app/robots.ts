import type { MetadataRoute } from "next";

import { adminRoutes } from "@/config/admin-routes";
import { env } from "@/lib/env";

/**
 * robots.txt (ADR-043). Until launch (`SITE_INDEXING` off) the whole site is closed to crawlers;
 * after it, only the staff area and API stay closed. The sitemap is added in Phase 7.
 */
export default function robots(): MetadataRoute.Robots {
  if (!env.SITE_INDEXING) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: [adminRoutes.home, "/api/"] } };
}
