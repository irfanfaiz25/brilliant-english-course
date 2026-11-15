import "server-only";

import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";

import { gradeLabelKeys, type GradeLabels } from "./grades";

/** The `Grades` templates of `locale`, for `formatGradeSpan()` on the server. */
export async function gradeLabelsFor(locale: Locale): Promise<GradeLabels> {
  const t = await getTranslations({ locale, namespace: "Grades" });
  return Object.fromEntries(
    gradeLabelKeys.map((key) => [key, t.raw(key) as string]),
  ) as GradeLabels;
}
