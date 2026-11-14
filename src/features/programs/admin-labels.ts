import "server-only";

import { getTranslations } from "next-intl/server";

import { routing } from "@/i18n/routing";

import type { LevelCardLabels } from "./components/level-card-preview";

/** The public level card's labels in every locale, as templates the live preview fills in. */
export async function levelCardLabels(): Promise<LevelCardLabels> {
  const entries = await Promise.all(
    routing.locales.map(async (locale) => {
      const t = await getTranslations({ locale, namespace: "Home.programs" });
      return [locale, { ageRange: t.raw("ageRange") as string, detailLink: t("detailLink") }];
    }),
  );
  return Object.fromEntries(entries) as LevelCardLabels;
}
