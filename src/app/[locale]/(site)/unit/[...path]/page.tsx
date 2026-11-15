import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { PageCanvas } from "@/components/site/page-canvas";
import { getLevels } from "@/features/programs/queries";
import { directoryPaths, directoryUnits, resolveDirectoryPath } from "@/features/units/directory";
import { getUnitDirectory } from "@/features/units/queries";
import { routing } from "@/i18n/routing";
import { localizedAlternates } from "@/lib/seo/alternates";
import { atLeastOneParam, placeholderParam } from "@/lib/static-params";

import { AreaView } from "../_sections/area-view";
import { UnitView } from "../_sections/unit-view";

type Props = PageProps<"/[locale]/unit/[...path]">;

/** Prerender every province, regency and unit page; areas without units have no page. */
export async function generateStaticParams() {
  const directory = await getUnitDirectory();
  return atLeastOneParam(
    directoryPaths(directory).map((path) => ({ path })),
    { path: [placeholderParam] },
  );
}

async function resolve(path: string[]) {
  const directory = await getUnitDirectory();
  return { directory, match: resolveDirectoryPath(directory, path) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, path } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const { match } = await resolve(path);
  if (!match) return {};

  const href = { pathname: "/unit/[...path]" as const, params: { path } };
  const alternates = localizedAlternates(href, locale);

  if (match.kind === "unit") {
    const [t, levels] = await Promise.all([
      getTranslations({ locale, namespace: "UnitPages.unit" }),
      getLevels(locale),
    ]);
    const values = {
      unit: match.unit.name,
      district: match.unit.district,
      regency: match.regency.name,
      levels: levels
        .filter((level) => match.unit.levels.includes(level.slug))
        .map((level) => level.name)
        .join(", "),
    };
    return {
      title: { absolute: t("metaTitle", values) },
      description: t("metaDescription", values),
      alternates,
    };
  }

  const t = await getTranslations({ locale, namespace: "UnitPages.area" });
  const area = match.kind === "regency" ? match.regency : match.province;
  const count = match.kind === "regency" ? match.regency.units.length : match.province.unitCount;
  return {
    title: t("metaTitle", { area: area.name }),
    description: t("metaDescription", { area: area.name, count }),
    alternates,
  };
}

/**
 * `/unit/[provinsi]`, `/unit/[provinsi]/[kabupaten]` and `/unit/[provinsi]/[kabupaten]/[unit]`
 * (Phase 5c-2, ADR-021): local landing pages generated from the unit directory.
 */
export default async function UnitDirectoryPathPage({ params }: Props) {
  const { locale, path } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const { directory, match } = await resolve(path);
  if (!match) notFound();

  return (
    <PageCanvas>
      {match.kind === "unit" ? (
        <UnitView
          province={match.province}
          regency={match.regency}
          unit={match.unit}
          allUnits={directoryUnits(directory)}
        />
      ) : match.kind === "regency" ? (
        <AreaView kind="regency" province={match.province} regency={match.regency} />
      ) : (
        <AreaView kind="province" province={match.province} />
      )}
    </PageCanvas>
  );
}
