import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { ClosingCtaSection } from "@/components/site/closing-cta-section";
import { FaqSection } from "@/components/site/faq-section";
import { PageCanvas } from "@/components/site/page-canvas";
import { ActivitiesSection } from "@/features/activities/components/activities-section";
import { getActivities } from "@/features/activities/queries";
import { getFaqItems } from "@/features/faq/queries";
import { getLevels } from "@/features/programs/queries";
import { TestimonialsSection } from "@/features/testimonials/components/testimonials-section";
import { getTestimonials } from "@/features/testimonials/queries";
import { unitPathsByCode } from "@/features/units/directory";
import { getFeaturedUnits, getNetworkStats, getUnitDirectory } from "@/features/units/queries";
import { pageMetadata } from "@/features/seo/pages";
import { routing } from "@/i18n/routing";

import { HeroSection } from "./_home/hero-section";
import { PartnershipSection } from "./_home/partnership-section";
import { ProgramsSection } from "./_home/programs-section";
import { StatsSection } from "./_home/stats-section";
import { StepsSection } from "./_home/steps-section";
import { UnitFinderSection } from "./_home/unit-finder-section";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return pageMetadata("home", locale);
}

/**
 * Home page (Phase 5a): parent journey first (hero → programs → find a unit → how to join),
 * then the partner teaser, social proof, FAQ and a closing call to action.
 */
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;

  const t = await getTranslations("Home");
  const tWhatsApp = await getTranslations("WhatsApp");
  const [levels, activities, stats, units, directory, testimonials, faqItems] = await Promise.all([
    getLevels(locale),
    getActivities(locale),
    getNetworkStats(),
    getFeaturedUnits(),
    getUnitDirectory(),
    getTestimonials(locale, "parent"),
    getFaqItems(locale, "parents"),
  ]);

  return (
    <PageCanvas>
      <HeroSection levels={levels} />
      <StatsSection stats={stats} />
      <ProgramsSection levels={levels} />
      <ActivitiesSection activities={activities} />
      <UnitFinderSection units={units} unitPaths={unitPathsByCode(directory)} />
      <StepsSection />
      <PartnershipSection activeUnits={stats.activeUnits} />
      <TestimonialsSection
        testimonials={testimonials}
        overline={t("testimonials.overline")}
        title={t("testimonials.title")}
        lead={t("testimonials.lead")}
      />
      <FaqSection
        overline={t("faq.overline")}
        title={t("faq.title")}
        lead={t("faq.lead")}
        items={faqItems}
        help={{
          title: t("faq.askTitle"),
          text: t("faq.askText"),
          cta: t("faq.askCta"),
          whatsappMessage: tWhatsApp("general"),
        }}
      />
      <ClosingCtaSection
        title={t("cta.title")}
        lead={t("cta.lead")}
        primaryLabel={t("cta.primary")}
        secondaryLabel={t("cta.secondary")}
        whatsappMessage={tWhatsApp("general")}
      />
    </PageCanvas>
  );
}
