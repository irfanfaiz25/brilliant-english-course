import {
  ArrowRightIcon,
  ClockIcon,
  InfoIcon,
  MapIcon,
  MapPinIcon,
  NavigationIcon,
  UserRoundIcon,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { BrandIcon } from "@/components/icons/brand-icon";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { DecorBlob } from "@/components/site/decor-blob";
import { FactRow } from "@/components/site/fact-row";
import { HeroChip, PageHero } from "@/components/site/page-hero";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActivitiesSection } from "@/features/activities/components/activities-section";
import { getActivities } from "@/features/activities/queries";
import { levelTheme } from "@/features/programs/level-theme";
import { getLevels } from "@/features/programs/queries";
import type {
  DirectoryProvince,
  DirectoryRegency,
  DirectoryUnit,
} from "@/features/units/directory";
import type { EnrollmentStatus } from "@/features/units/schema";
import { unitJsonLd } from "@/features/units/seo";
import {
  buildDirectionsUrl,
  buildMapUrl,
  distanceKm,
  formatUnitSchedule,
  unitInitials,
} from "@/features/units/service";
import { getPathname, Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/seo/absolute-url";
import { JsonLd } from "@/lib/seo/json-ld";
import { cn } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

import { UnitsGrid } from "./units-grid";

const NEARBY_UNITS = 3;

const enrollmentBadge: Record<EnrollmentStatus, NonNullable<BadgeProps["variant"]>> = {
  open: "success",
  limited: "warning",
  full: "destructive",
};

const unitHref = (path: readonly string[]) => ({
  pathname: "/unit/[...path]" as const,
  params: { path: [...path] },
});

/**
 * One unit's page: who and where it is, schedule, classes, the two actions parents need
 * (WhatsApp the unit, get directions), its activities and the nearest other units.
 */
export async function UnitView({
  province,
  regency,
  unit,
  allUnits,
}: {
  province: DirectoryProvince;
  regency: DirectoryRegency;
  unit: DirectoryUnit;
  allUnits: readonly DirectoryUnit[];
}) {
  const t = await getTranslations("UnitPages.unit");
  const tUnits = await getTranslations("Units");
  const tNav = await getTranslations("Nav");
  const tWhatsApp = await getTranslations("WhatsApp");
  const locale = (await getLocale()) as Locale;
  const [levels, activities] = await Promise.all([getLevels(locale), getActivities(locale)]);

  const offered = levels.filter((level) => unit.levels.includes(level.slug));
  const nearby = allUnits
    .filter((other) => other.code !== unit.code)
    .map((other) => ({ unit: other, km: distanceKm(unit.location, other.location) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, NEARBY_UNITS);
  const distanceFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const kmByCode = new Map(nearby.map((entry) => [entry.unit.code, entry.km]));
  const url = absoluteUrl(getPathname({ href: unitHref(unit.path), locale }));

  return (
    <>
      <JsonLd data={unitJsonLd(unit, { url, region: province.name })} />
      <PageHero
        id="unit-title"
        titleTone="foreground"
        breadcrumbs={[
          { label: tNav("home"), href: "/" },
          { label: tNav("allUnits"), href: "/unit" },
          { label: province.name, href: unitHref(province.path) },
          { label: regency.name, href: unitHref(regency.path) },
          { label: unit.name, href: unitHref(unit.path) },
        ]}
        overline={t("overline", { regency: regency.name })}
        title={unit.name}
        lead={t("lead", { district: unit.district, regency: regency.name })}
      >
        <Badge variant={enrollmentBadge[unit.enrollment]} dot>
          {tUnits("enrollment", { status: unit.enrollment })}
        </Badge>
        <HeroChip icon={<MapPinIcon aria-hidden />}>
          {unit.district}, {regency.name}
        </HeroChip>
        <HeroChip icon={<InfoIcon aria-hidden />}>{tUnits("code", { code: unit.code })}</HeroChip>
      </PageHero>

      <Section aria-labelledby="unit-details-title" spacing="compact" className="pt-2 md:pt-4">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-8">
          {/* Directly under the hero, so it is in the first viewport on phones. */}
          <Reveal immediate>
            <article
              aria-labelledby="unit-details-title"
              className="relative isolate flex flex-col gap-6 overflow-hidden rounded-3xl border border-border/60 bg-card p-5 shadow-glow-primary sm:p-8"
            >
              <DecorBlob tone="primary" className="-top-16 -right-16 size-56 opacity-60" />
              <header className="flex items-center gap-4">
                <span
                  aria-hidden
                  className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand text-h5 text-inverse-foreground shadow-glow-primary"
                >
                  {unitInitials(unit.name)}
                </span>
                <h2 id="unit-details-title" className="text-h4 text-foreground">
                  {t("detailsTitle")}
                </h2>
              </header>

              <dl className="flex flex-col gap-5">
                <FactRow icon={<MapPinIcon aria-hidden />} label={tUnits("address")}>
                  <span className="flex flex-col gap-2">
                    {unit.address}
                    <a
                      href={buildMapUrl(unit.location)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-fit items-center gap-1.5 text-label text-primary underline-offset-4 hover:underline"
                    >
                      <MapIcon aria-hidden className="size-4" />
                      {t("mapLink")}
                    </a>
                  </span>
                </FactRow>
                <FactRow icon={<ClockIcon aria-hidden />} label={tUnits("schedule")}>
                  {formatUnitSchedule(unit, locale)}
                </FactRow>
                <FactRow icon={<UserRoundIcon aria-hidden />} label={tUnits("managerLabel")}>
                  {unit.manager}
                </FactRow>
              </dl>

              <p
                className={cn(
                  "flex items-start gap-2 rounded-xl px-4 py-3 text-body-sm",
                  unit.enrollment === "full"
                    ? "bg-destructive-soft text-destructive-strong"
                    : unit.enrollment === "limited"
                      ? "bg-warning-soft text-warning-strong"
                      : "bg-success-soft text-success-strong",
                )}
              >
                <InfoIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
                {t("enrollmentNote", { status: unit.enrollment })}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button asChild variant="whatsapp" size="lg" pop>
                  <a
                    href={buildWhatsAppUrl(unit.whatsapp, tWhatsApp("unit", { unit: unit.name }))}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <BrandIcon name="whatsapp" />
                    {tUnits("chat")}
                  </a>
                </Button>
                <Button asChild variant="secondary" size="lg" pop>
                  <a
                    href={buildDirectionsUrl(unit.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <NavigationIcon aria-hidden />
                    {tUnits("directions")}
                  </a>
                </Button>
              </div>
            </article>
          </Reveal>

          <section
            aria-labelledby="unit-levels-title"
            className="flex flex-col gap-4 lg:sticky lg:top-28"
          >
            <div className="flex flex-col gap-1">
              <h2 id="unit-levels-title" className="text-h4 text-foreground">
                {t("levelsTitle")}
              </h2>
              <p className="text-body-sm text-muted-foreground">{t("levelsLead")}</p>
            </div>
            <Stagger as="ul" className="flex flex-col gap-3">
              {offered.map((level) => {
                const theme = levelTheme[level.slug];
                return (
                  <StaggerItem key={level.slug} as="li">
                    <Link
                      href={{ pathname: "/program", hash: level.slug }}
                      aria-label={t("levelLink", { level: level.name })}
                      className={cn(
                        "group flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-card transition-[translate,box-shadow] duration-(--duration-base) ease-out hover:-translate-y-0.5 hover:shadow-lg",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex size-12 shrink-0 items-center justify-center rounded-xl text-label",
                          theme.soft,
                          theme.accent,
                        )}
                      >
                        {level.name.slice(0, 1)}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-label text-foreground">{level.name}</span>
                        <span className="text-caption text-muted-foreground">
                          {t("levelAge", { min: level.ageMin, max: level.ageMax })}
                        </span>
                      </span>
                      <ArrowRightIcon
                        aria-hidden
                        className="size-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-base) ease-out group-hover:translate-x-1 group-hover:text-primary"
                      />
                    </Link>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </section>
        </div>
      </Section>

      <ActivitiesSection activities={activities} />

      {nearby.length > 0 && (
        <Section aria-labelledby="nearby-title" spacing="compact" className="pb-20 md:pb-28">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <SectionHeader
                id="nearby-title"
                overline={t("nearbyOverline")}
                title={t("nearbyTitle")}
              />
              <Link
                href={unitHref(regency.path)}
                className="inline-flex w-fit shrink-0 items-center gap-1.5 text-label text-primary underline-offset-4 hover:underline"
              >
                {t("allInArea", { area: regency.name })}
                <ArrowRightIcon aria-hidden className="size-4" />
              </Link>
            </div>
            <UnitsGrid
              units={nearby.map((entry) => entry.unit)}
              distanceLabel={(other) => {
                const km = kmByCode.get(other.code);
                return km === undefined
                  ? undefined
                  : t("distance", { distance: distanceFormat.format(km) });
              }}
            />
          </div>
        </Section>
      )}
    </>
  );
}
