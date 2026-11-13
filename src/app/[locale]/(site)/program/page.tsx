import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { ClosingCtaSection } from "@/components/site/closing-cta-section";
import { FaqSection } from "@/components/site/faq-section";
import { PageCanvas } from "@/components/site/page-canvas";
import { SectionTabs } from "@/components/site/section-tabs";
import { ActivitiesSection } from "@/features/activities/components/activities-section";
import { getActivities } from "@/features/activities/queries";
import { getFaqItems } from "@/features/faq/queries";
import { getLevels } from "@/features/programs/queries";
import { routing } from "@/i18n/routing";
import { localizedAlternates } from "@/lib/seo/alternates";

import { CompareSection } from "./_sections/compare-section";
import { LevelDetail } from "./_sections/level-detail";
import { ProgramHero } from "./_sections/program-hero";
import { WhySection } from "./_sections/why-section";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/program">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Program" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: localizedAlternates("/program", locale),
  };
}

/**
 * Program page (Phase 5b): sticky level tabs with scroll-spy over one detail section per level
 * (anchors `#kindy`, `#intro`, `#secondary`), then activities (`#kegiatan`), why BEC, a level
 * comparison, FAQ and a closing call to action.
 */
export default async function ProgramPage({ params }: PageProps<"/[locale]/program">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;

  const t = await getTranslations("Program");
  const tWhatsApp = await getTranslations("WhatsApp");
  const [levels, activities, faqItems] = await Promise.all([
    getLevels(locale),
    getActivities(locale),
    getFaqItems(locale, "program"),
  ]);

  return (
    <PageCanvas>
      <ProgramHero />
      <SectionTabs
        label={t("tabs.label")}
        tabs={levels.map((level) => ({
          slug: level.slug,
          label: level.name,
          meta: t("tabs.age", { min: level.ageMin, max: level.ageMax }),
        }))}
      />
      {levels.map((level, index) => (
        <LevelDetail
          key={level.slug}
          level={level}
          reversed={index % 2 === 1}
          aboveFold={index === 0}
        />
      ))}
      <ActivitiesSection activities={activities} id="kegiatan" linkToProgram={false} />
      <WhySection />
      <CompareSection levels={levels} />
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
