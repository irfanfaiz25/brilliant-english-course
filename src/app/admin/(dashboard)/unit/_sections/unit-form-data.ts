import "server-only";

import { adminLocale } from "@/config/admin-routes";
import { getAdminLevels } from "@/features/programs/admin-queries";
import { gradeLabelsFor } from "@/features/programs/grade-labels";
import { formatGradeSpan } from "@/features/programs/grades";
import { getRegionPickerLevels } from "@/features/regions/picker";
import { unitCardTemplates } from "@/features/units/admin-labels";
import type { SessionUser } from "@/features/users/schema";

/** What the unit form needs besides the unit itself: levels and classes, picker state and card texts. */
export async function loadUnitFormData(user: SessionUser, villageCode: string | null) {
  const [levels, regionLevels, templates, grades] = await Promise.all([
    getAdminLevels(user, adminLocale),
    getRegionPickerLevels(villageCode),
    unitCardTemplates(),
    gradeLabelsFor(adminLocale),
  ]);
  const name = (index: number) =>
    regionLevels[index]?.options.find((option) => option.code === regionLevels[index]?.value)
      ?.name ?? "";
  return {
    levelOptions: levels.map(({ slug, name, theme, classes }) => ({
      slug,
      name,
      theme,
      classes: classes.map((item) => ({
        id: item.id,
        name: item.name,
        grades: formatGradeSpan(item.gradeFrom, item.gradeTo, grades),
      })),
    })),
    regionLevels,
    templates,
    place: { regency: name(1), district: name(2) },
  };
}
