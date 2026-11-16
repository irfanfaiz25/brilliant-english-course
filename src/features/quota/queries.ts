import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { cacheTags } from "@/config/cache-tags";
import { db } from "@/db/client";
import { readSetting } from "@/features/settings/queries";

import { quotaRulesDefaults } from "./defaults";
import { quotaRulesSchema, type QuotaRules, type VillageQuota } from "./schema";
import { quotaFromCounts, villageUsage, villagesUsage } from "./service";

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

/** Quota of several villages at once (region search results), in the order given. */
export async function getVillageQuotas(villageCodes: readonly string[]): Promise<VillageQuota[]> {
  "use cache";
  cacheTag(cacheTags.quota, cacheTags.units, cacheTags.settings);
  cacheLife("minutes");

  const [usage, rules] = await Promise.all([villagesUsage(db, villageCodes), getQuotaRules()]);
  return villageCodes.map((code) => {
    const counts = usage.get(code) ?? { activeUnits: 0, reserved: 0 };
    return quotaFromCounts(code, counts.activeUnits, counts.reserved, rules);
  });
}
