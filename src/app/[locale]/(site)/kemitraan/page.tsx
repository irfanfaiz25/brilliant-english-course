import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { ClosingCtaSection } from "@/components/site/closing-cta-section";
import { FaqSection } from "@/components/site/faq-section";
import { PageCanvas } from "@/components/site/page-canvas";
import { SectionTabs } from "@/components/site/section-tabs";
import { getFaqItems } from "@/features/faq/queries";
import { getPartnershipPage } from "@/features/partners/queries";
import { TestimonialsSection } from "@/features/testimonials/components/testimonials-section";
import { getTestimonials } from "@/features/testimonials/queries";
import { getNetworkStats } from "@/features/units/queries";
import { pageMetadata } from "@/features/seo/pages";
import { routing } from "@/i18n/routing";

import { ApplySection } from "./_sections/apply-section";
import { BenefitsSection } from "./_sections/benefits-section";
import { FitSection } from "./_sections/fit-section";
import { PartnershipHero } from "./_sections/partnership-hero";
import { StarterKitSection } from "./_sections/starter-kit-section";
import { StepsSection } from "./_sections/steps-section";
import { TrainingSection } from "./_sections/training-section";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/kemitraan">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return pageMetadata("partnership", locale);
}

/**
 * Kemitraan (Phase 5d, content from ADR-041): the partner journey from promise to application —
 * benefits, the starter kit and investment, training, who fits, the procedure, then the village
 * quota checker and the two-step form, followed by partner stories, FAQ and a closing call to
 * action. Sticky tabs jump between the sections; the section content is edited in admin.
 */
export default async function PartnershipPage(props: PageProps<"/[locale]/kemitraan">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) return null;

  const t = await getTranslations("Partnership");
  const tWhatsApp = await getTranslations("WhatsApp");
  const [stats, content, stories, faqItems] = await Promise.all([
    getNetworkStats(),
    getPartnershipPage(locale),
    getTestimonials(locale, "partner"),
    getFaqItems(locale, "partners"),
  ]);

  const tabs = [
    { slug: "keuntungan", label: t("tabs.benefits") },
    { slug: "starter-kit", label: t("tabs.kit") },
    { slug: "pelatihan", label: t("tabs.training") },
    { slug: "cocok", label: t("tabs.fit") },
    { slug: "alur", label: t("tabs.steps") },
    { slug: "kuota", label: t("tabs.apply") },
    { slug: "cerita", label: t("tabs.stories") },
    { slug: "faq", label: t("tabs.faq") },
  ];

  return (
    <PageCanvas>
      <PartnershipHero
        stats={stats}
        highlights={content.benefits.filter((benefit) => benefit.featured)}
      />
      <SectionTabs label={t("tabs.label")} tabs={tabs} />
      <BenefitsSection benefits={content.benefits} />
      <StarterKitSection kit={content.kit} />
      <TrainingSection training={content.training} />
      <FitSection />
      <StepsSection steps={content.steps} />
      <ApplySection searchParams={props.searchParams} />
      <TestimonialsSection
        id="cerita"
        testimonials={stories}
        overline={t("stories.overline")}
        title={t("stories.title")}
        lead={t("stories.lead")}
      />
      <FaqSection
        id="faq"
        overline={t("faq.overline")}
        title={t("faq.title")}
        lead={t("faq.lead")}
        items={faqItems}
        help={{
          title: t("faq.askTitle"),
          text: t("faq.askText"),
          cta: t("faq.askCta"),
          whatsappMessage: tWhatsApp("partner"),
        }}
      />
      <ClosingCtaSection
        audience="partner"
        title={t("cta.title")}
        lead={t("cta.lead")}
        primaryLabel={t("cta.primary")}
        secondaryLabel={t("cta.secondary")}
        whatsappMessage={tWhatsApp("partner")}
      />
    </PageCanvas>
  );
}
