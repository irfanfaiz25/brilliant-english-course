import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { PageCanvas } from "@/components/site/page-canvas";
import { siteConfig } from "@/config/site";
import { getActivities } from "@/features/activities/queries";
import { getFaqItems } from "@/features/faq/queries";
import { getLevels } from "@/features/programs/queries";
import { getTestimonials } from "@/features/testimonials/queries";
import { getFeaturedUnits, getNetworkStats } from "@/features/units/queries";
import { routing } from "@/i18n/routing";
import { localizedAlternates } from "@/lib/seo/alternates";

import { ActivitiesSection } from "./_home/activities-section";
import { CtaSection } from "./_home/cta-section";
import { FaqSection } from "./_home/faq-section";
import { HeroSection } from "./_home/hero-section";
import { PartnershipSection } from "./_home/partnership-section";
import { ProgramsSection } from "./_home/programs-section";
import { StatsSection } from "./_home/stats-section";
import { StepsSection } from "./_home/steps-section";
import { TestimonialsSection } from "./_home/testimonials-section";
import { UnitFinderSection } from "./_home/unit-finder-section";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Home" });

  return {
    title: { absolute: `${siteConfig.name} — ${t("metaTitle")}` },
    alternates: localizedAlternates("/", locale),
  };
}

/**
 * Home page (Phase 5a): parent journey first (hero → programs → find a unit → how to join),
 * then the partner teaser, social proof, FAQ and a closing call to action.
 */
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;

  const [levels, activities, stats, units, testimonials, faqItems] = await Promise.all([
    getLevels(locale),
    getActivities(locale),
    getNetworkStats(),
    getFeaturedUnits(),
    getTestimonials(locale, "parent"),
    getFaqItems(locale, "parents"),
  ]);

  return (
    <PageCanvas>
      <HeroSection levels={levels} />
      <StatsSection stats={stats} />
      <ProgramsSection levels={levels} />
      <ActivitiesSection activities={activities} />
      <UnitFinderSection units={units} />
      <StepsSection />
      <PartnershipSection activeUnits={stats.activeUnits} />
      <TestimonialsSection testimonials={testimonials} />
      <FaqSection items={faqItems} />
      <CtaSection />
    </PageCanvas>
  );
}
