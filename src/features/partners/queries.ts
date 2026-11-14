import "server-only";

import { readSetting } from "@/features/settings/queries";
import type { Locale } from "@/i18n/routing";

import { partnershipPackageDefaults } from "./defaults";
import {
  partnershipSettingSchema,
  type PartnershipPackage,
  type PartnershipSetting,
} from "./schema";

/** Both locales of the `partnership` setting: the saved one or the code defaults. */
export async function getPartnershipSetting(): Promise<PartnershipSetting> {
  return readSetting("partnership", partnershipSettingSchema, partnershipPackageDefaults);
}

/** The partnership package in `locale`: the saved setting or the code defaults. */
export async function getPartnershipPackage(locale: Locale): Promise<PartnershipPackage> {
  return (await getPartnershipSetting())[locale];
}
