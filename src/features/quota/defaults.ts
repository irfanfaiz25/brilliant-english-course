import { limits } from "@/config/limits";

import type { QuotaRules } from "./schema";

/** Code default of the `quota` setting, used until an admin saves the rules. */
export const quotaRulesDefaults: QuotaRules = {
  unitsPerVillage: limits.unitsPerVillage,
  almostFullAt: limits.quotaAlmostFullAt,
};
