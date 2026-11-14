import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { PageCanvas } from "@/components/site/page-canvas";
import { PartnerBanner } from "@/components/site/partner-banner";
import { Section } from "@/components/site/section";
import { pageMetadata } from "@/features/seo/pages";
import { routing } from "@/i18n/routing";

import { Finder } from "./_sections/finder";
import { FinderHero } from "./_sections/finder-hero";
import { FinderSkeleton } from "./_sections/finder-skeleton";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/cek-unit">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return pageMetadata("finder", locale);
}

/**
 * Cek Unit (Phase 5c). The header is static; the finder reads `searchParams`, so it streams in
 * behind a shape-matched skeleton (Cache Components) and later searches swap in place.
 */
export default async function FinderPage(props: PageProps<"/[locale]/cek-unit">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) return null;
  const t = await getTranslations("Finder.results");
  const tPartner = await getTranslations("Finder.partner");

  return (
    <PageCanvas>
      <FinderHero />
      <Section spacing="none" className="pb-12 md:pb-16">
        <Suspense fallback={<FinderSkeleton label={t("loading")} />}>
          <Finder searchParams={props.searchParams} />
        </Suspense>
      </Section>
      <PartnerBanner title={tPartner("title")} text={tPartner("text")} cta={tPartner("cta")} />
    </PageCanvas>
  );
}
