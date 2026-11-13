import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { siteConfig } from "@/config/site";
import { getActivities } from "@/features/activities/queries";
import { getLevels } from "@/features/programs/queries";
import { getNetworkStats } from "@/features/units/queries";
import { routing } from "@/i18n/routing";
import { localizedAlternates } from "@/lib/seo/alternates";

import { ActivitiesSection } from "./_home/activities-section";
import { HeroSection } from "./_home/hero-section";
import { ProgramsSection } from "./_home/programs-section";
import { StatsSection } from "./_home/stats-section";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Home" });

  return {
    title: { absolute: `${siteConfig.name} — ${t("metaTitle")}` },
    alternates: localizedAlternates("/", locale),
  };
}

/** Home page, built section by section (Phase 5a). Remaining sections arrive in 5a-2. */
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;

  const [levels, activities, stats] = await Promise.all([
    getLevels(locale),
    getActivities(locale),
    getNetworkStats(),
  ]);

  return (
    <>
      <HeroSection levels={levels} />
      <StatsSection stats={stats} />
      <ProgramsSection levels={levels} />
      <ActivitiesSection activities={activities} />
    </>
  );
}
