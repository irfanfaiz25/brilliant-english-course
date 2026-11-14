import "server-only";

import { getTranslations } from "next-intl/server";

import { routing } from "@/i18n/routing";

import type { ActivityCardLabels } from "./components/activity-card-preview";

/** The public activity card's link label in every locale, for the live preview. */
export async function activityCardLabels(): Promise<ActivityCardLabels> {
  const entries = await Promise.all(
    routing.locales.map(async (locale) => {
      const t = await getTranslations({ locale, namespace: "Activities" });
      return [locale, { detailLink: t("detailLink") }];
    }),
  );
  return Object.fromEntries(entries) as ActivityCardLabels;
}
