import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";
import { db } from "@/db/client";
import { readSetting } from "@/features/settings/queries";

import { quotaRulesDefaults } from "./defaults";
import { quotaRulesSchema, type QuotaRules, type VillageQuota } from "./schema";
import { quotaFromCounts, villageUsage } from "./service";

/** The admin-set quota rules, or the code defaults (`limits`) until someone saves them. */
export async function getQuotaRules(): Promise<QuotaRules> {
  return readSetting("quota", quotaRulesSchema, quotaRulesDefaults);
}

/** Partnership quota of one village: active units located in it plus open reservations. */
export async function getVillageQuota(villageCode: string): Promise<VillageQuota> {
  "use cache";
  cacheTag(cacheTags.quota, cacheTags.units, cacheTags.settings);
  cacheLife("minutes");

  const [usage, rules] = await Promise.all([villageUsage(db, villageCode), getQuotaRules()]);
  return quotaFromCounts(villageCode, usage.activeUnits, usage.reserved, rules);
}
