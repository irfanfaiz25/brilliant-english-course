import "server-only";

import { adminLocale } from "@/config/admin-routes";
import { getAdminLevels } from "@/features/programs/admin-queries";
import { getRegionPickerLevels } from "@/features/regions/picker";
import { unitCardTemplates } from "@/features/units/admin-labels";
import type { SessionUser } from "@/features/users/schema";

/** What the unit form needs besides the unit itself: levels, picker state and card texts. */
export async function loadUnitFormData(user: SessionUser, villageCode: string | null) {
  const [levels, regionLevels, templates] = await Promise.all([
    getAdminLevels(user, adminLocale),
    getRegionPickerLevels(villageCode),
    unitCardTemplates(),
  ]);
  const name = (index: number) =>
    regionLevels[index]?.options.find((option) => option.code === regionLevels[index]?.value)
      ?.name ?? "";
  return {
    levelOptions: levels.map((level) => ({ slug: level.slug, name: level.name })),
    regionLevels,
    templates,
    place: { regency: name(1), district: name(2) },
  };
}
