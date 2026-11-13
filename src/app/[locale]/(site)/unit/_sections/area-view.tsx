import { GraduationCapIcon, LocateFixedIcon, MapPinIcon, StoreIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Reveal } from "@/components/motion/reveal";
import { HeroChip, PageHero } from "@/components/site/page-hero";
import { PartnerBanner } from "@/components/site/partner-banner";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import { Button } from "@/components/ui/button";
import type { DirectoryProvince, DirectoryRegency } from "@/features/units/directory";
import { unitJsonLd } from "@/features/units/seo";
import { getPathname, Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/seo/absolute-url";
import { itemListJsonLd, JsonLd } from "@/lib/seo/json-ld";

import { RegencyCards } from "./regency-cards";
import { UnitsGrid } from "./units-grid";

type AreaViewProps =
  | { kind: "province"; province: DirectoryProvince }
  | { kind: "regency"; province: DirectoryProvince; regency: DirectoryRegency };

/**
 * Area landing page (province or regency): "Kursus Bahasa Inggris Anak di {area}" with the
 * area's units, its regencies (province pages), a nearest-unit search and the partner nudge.
 */
export async function AreaView(props: AreaViewProps) {
  const t = await getTranslations("UnitPages.area");
  const tNav = await getTranslations("Nav");
  const locale = (await getLocale()) as Locale;
  const { province } = props;
  const area = props.kind === "regency" ? props.regency : province;
  const units =
    props.kind === "regency" ? props.regency.units : province.regencies.flatMap((r) => r.units);
  const districts = new Set(units.map((unit) => unit.district)).size;

  const breadcrumbs = [
    { label: tNav("home"), href: "/" as const },
    { label: tNav("allUnits"), href: "/unit" as const },
    {
      label: province.name,
      href: { pathname: "/unit/[...path]" as const, params: { path: province.path } },
    },
    ...(props.kind === "regency"
      ? [
          {
            label: props.regency.name,
            href: { pathname: "/unit/[...path]" as const, params: { path: props.regency.path } },
          },
        ]
      : []),
  ];

  return (
    <>
      <JsonLd
        data={itemListJsonLd(
          units.map((unit) =>
            unitJsonLd(unit, {
              url: absoluteUrl(
                getPathname({
                  href: { pathname: "/unit/[...path]", params: { path: unit.path } },
                  locale,
                }),
              ),
              region: province.name,
            }),
          ),
        )}
      />
      <PageHero
        id="area-title"
        breadcrumbs={breadcrumbs}
        overline={t("overline", { area: area.name })}
        title={t("title", { area: area.name })}
        lead={t("lead", { count: units.length, area: area.name })}
      >
        <HeroChip icon={<StoreIcon aria-hidden />}>{t("units", { count: units.length })}</HeroChip>
        <HeroChip icon={<MapPinIcon aria-hidden />}>
          {props.kind === "province"
            ? t("regencyCount", { count: province.regencies.length })
            : t("districtCount", { count: districts })}
        </HeroChip>
        <HeroChip icon={<GraduationCapIcon aria-hidden />}>{t("levels")}</HeroChip>
      </PageHero>

      {props.kind === "province" && (
        <Section aria-labelledby="regencies-title" spacing="compact" className="pt-4 md:pt-6">
          <SectionHeader
            id="regencies-title"
            overline={tNav("allUnits")}
            title={t("regenciesTitle", { area: province.name })}
          />
          <div className="mt-6">
            <RegencyCards regencies={province.regencies} />
          </div>
        </Section>
      )}

      <Section aria-labelledby="units-title" spacing="compact" className="pt-4 md:pt-6">
        <div className="flex flex-col gap-6">
          <SectionHeader
            id="units-title"
            overline={t("unitsOverline")}
            title={t("unitsTitle", { area: area.name })}
            lead={t("unitsLead")}
          />
          <UnitsGrid units={units} />
          <Reveal>
            <div className="flex flex-col items-start gap-4 rounded-3xl border border-border/60 bg-card p-5 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-start gap-3">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <LocateFixedIcon aria-hidden className="size-5" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <p className="text-h5 text-foreground">{t("finder")}</p>
                  <p className="text-body-sm text-muted-foreground">
                    {t("finderText", { area: area.name })}
                  </p>
                </div>
              </div>
              <Button asChild variant="secondary" className="shrink-0">
                <Link href={{ pathname: "/cek-unit", query: { wilayah: area.code, dekat: "1" } }}>
                  <LocateFixedIcon aria-hidden />
                  {t("finderCta")}
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </Section>

      <PartnerBanner
        title={t("partner.title", { area: area.name })}
        text={t("partner.text")}
        cta={t("partner.cta")}
        href={{ pathname: "/kemitraan", query: { wilayah: area.code }, hash: "kuota" }}
      />
    </>
  );
}
