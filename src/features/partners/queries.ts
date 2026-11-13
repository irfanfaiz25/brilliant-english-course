import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";
import type { Locale } from "@/i18n/routing";

import { partnershipPackageFixtures } from "./fixtures";
import type { PartnershipPackage } from "./schema";

/** The partnership package. Reads fixtures until admin settings land (Phase 4a). */
export async function getPartnershipPackage(locale: Locale): Promise<PartnershipPackage> {
  "use cache";
  cacheTag(cacheTags.settings);
  cacheLife("hours");
  return partnershipPackageFixtures[locale];
}
