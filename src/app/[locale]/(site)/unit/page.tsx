import { LocateFixedIcon, StoreIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { Reveal } from "@/components/motion/reveal";
import { PageCanvas } from "@/components/site/page-canvas";
import { HeroChip, PageHero } from "@/components/site/page-hero";
import { PartnerBanner } from "@/components/site/partner-banner";
import { Section } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { getUnitDirectory } from "@/features/units/queries";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { localizedAlternates } from "@/lib/seo/alternates";

import { RegencyCards } from "./_sections/regency-cards";

export async function generateMetadata({ params }: PageProps<"/[locale]/unit">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "UnitPages.directory" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: localizedAlternates("/unit", locale),
  };
}

/**
 * Unit directory (Phase 5c-2): every province and regency with active units, linking to the
 * area pages — the crawlable hub for local search (ADR-021).
 */
export default async function UnitDirectoryPage({ params }: PageProps<"/[locale]/unit">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;

  const t = await getTranslations("UnitPages.directory");
  const tNav = await getTranslations("Nav");
  const tPartner = await getTranslations("Finder.partner");
  const directory = await getUnitDirectory();
  const total = directory.provinces.reduce((sum, province) => sum + province.unitCount, 0);

  return (
    <PageCanvas>
      <PageHero
        id="directory-title"
        breadcrumbs={[
          { label: tNav("home"), href: "/" },
          { label: tNav("allUnits"), href: "/unit" },
        ]}
        overline={t("overline")}
        title={t("title")}
        lead={t("lead")}
      >
        <HeroChip icon={<StoreIcon aria-hidden />}>{t("unitCount", { count: total })}</HeroChip>
        <Button asChild variant="secondary" size="sm">
          <Link href={{ pathname: "/cek-unit", query: { dekat: "1" } }}>
            <LocateFixedIcon aria-hidden />
            {t("finder")}
          </Link>
        </Button>
      </PageHero>

      {directory.provinces.map((province) => (
        <Section
          key={province.code}
          aria-labelledby={`province-${province.code}`}
          spacing="compact"
          className="pt-4 md:pt-6"
        >
          <Reveal className="flex flex-col gap-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 id={`province-${province.code}`} className="text-h3 text-foreground">
                <Link
                  href={{ pathname: "/unit/[...path]", params: { path: province.path } }}
                  className="rounded-sm underline-offset-4 transition-colors duration-(--duration-fast) hover:text-primary hover:underline"
                >
                  {province.name}
                </Link>
              </h2>
              <p className="text-body-sm text-muted-foreground">
                {t("unitCount", { count: province.unitCount })}
              </p>
            </div>
            <RegencyCards regencies={province.regencies} />
          </Reveal>
        </Section>
      ))}

      <PartnerBanner title={tPartner("title")} text={tPartner("text")} cta={tPartner("cta")} />
    </PageCanvas>
  );
}
