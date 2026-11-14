import "server-only";

import { z } from "zod";

import { readSetting } from "@/features/settings/queries";
import type { Locale } from "@/i18n/routing";

import { partnershipPackageDefaults } from "./defaults";
import { partnershipPackageSchema, type PartnershipPackage } from "./schema";

/** The `partnership` setting: one package per locale, admin-editable from Phase 4a. */
const partnershipSettingSchema = z.object({
  id: partnershipPackageSchema,
  en: partnershipPackageSchema,
});

/** The partnership package in `locale`: the saved setting or the code defaults. */
export async function getPartnershipPackage(locale: Locale): Promise<PartnershipPackage> {
  const packages = await readSetting(
    "partnership",
    partnershipSettingSchema,
    partnershipPackageDefaults,
  );
  return packages[locale];
}
