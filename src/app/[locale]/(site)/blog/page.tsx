import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { ClosingCtaSection } from "@/components/site/closing-cta-section";
import { PageCanvas } from "@/components/site/page-canvas";
import { Section } from "@/components/site/section";
import { pageMetadata } from "@/features/seo/pages";
import { routing } from "@/i18n/routing";

import { BlogHero } from "./_sections/blog-hero";
import { BlogListing } from "./_sections/blog-listing";
import { BlogSkeleton } from "./_sections/blog-skeleton";

export async function generateMetadata({ params }: PageProps<"/[locale]/blog">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return pageMetadata("blog", locale);
}

/**
 * Blog index (Phase 5e). The header is static; the listing reads `?kategori=&halaman=`, so it
 * streams in behind a shape-matched skeleton (Cache Components).
 */
export default async function BlogPage(props: PageProps<"/[locale]/blog">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) return null;
  const t = await getTranslations("Blog");
  const tWhatsApp = await getTranslations("WhatsApp");

  return (
    <PageCanvas>
      <BlogHero />
      <Section id="artikel" spacing="none" className="scroll-mt-24 pb-6 md:pb-10">
        <Suspense fallback={<BlogSkeleton label={t("loading")} />}>
          <BlogListing searchParams={props.searchParams} />
        </Suspense>
      </Section>
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
