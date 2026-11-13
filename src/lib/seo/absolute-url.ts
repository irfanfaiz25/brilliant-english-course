import { publicEnv } from "@/lib/public-env";

/** Turns a site-relative path (e.g. from `getPathname`) into an absolute URL for structured data. */
export function absoluteUrl(path: string): string {
  return new URL(path, publicEnv.NEXT_PUBLIC_SITE_URL).toString();
}
