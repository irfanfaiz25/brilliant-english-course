import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { PendingRegion, UrlStateShell } from "@/components/site/url-state-shell";
import { DecorBlob } from "@/components/site/decor-blob";
import { Doodle } from "@/components/site/doodle";
import { Section } from "@/components/site/section";
import { SectionHeader } from "@/components/site/section-header";
import { getQuotaRules, getVillageQuota } from "@/features/quota/queries";
import { RegionFilter } from "@/features/regions/components/region-filter";
import { buildRegionFields, getRegionFilterLabels } from "@/features/regions/fields";
import { getRegionPath } from "@/features/regions/queries";
import { regionCodeSchema, type Region } from "@/features/regions/schema";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { ApplySkeleton } from "./apply-skeleton";
import { PartnerForm, type SelectedVillage } from "./partner-form";
import { QuotaResult } from "./quota-result";

type SearchParams = PageProps<"/[locale]/kemitraan">["searchParams"];

/**
 * Quota checker (`#kuota`) and application form (`#daftar`) side by side from `lg`, stacked on
 * phones. The chosen region lives in the URL (`?wilayah=`, ADR-017) so links from Cek Unit arrive
 * pre-filled; the part that reads it streams in behind a skeleton.
 */
export async function ApplySection({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations("Partnership.apply");

  return (
    <Section id="kuota" aria-labelledby="apply-title" className="scroll-mt-16">
      <span
        aria-hidden
        className="absolute inset-0 -z-20 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)] bg-gradient-warm"
      />
      <DecorBlob tone="partner" className="parallax-soft top-32 -right-28 size-96" />
      <Doodle shape="plus" tone="primary" className="top-16 right-[12%] size-7 animate-float" />

      <SectionHeader
        id="apply-title"
        overline={t("overline")}
        title={t("title")}
        lead={t("lead")}
        align="center"
      />
      <div className="mt-10 lg:mt-14">
        <Suspense fallback={<ApplySkeleton label={t("loading")} />}>
          <QuotaAndForm searchParams={searchParams} />
        </Suspense>
      </div>
    </Section>
  );
}

async function QuotaAndForm({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations("Partnership.quota");
  const locale = (await getLocale()) as Locale;
  const raw = (await searchParams).wilayah;
  // Several `wilayah` values come from the no-JS form (one per select): the deepest one wins.
  const codes = (Array.isArray(raw) ? raw : [raw]).filter(
    (code): code is string => regionCodeSchema.safeParse(code).success,
  );
  const code = codes.sort((a, b) => b.length - a.length)[0];

  const path = code ? await getRegionPath(code) : ([] as Region[]);
  const village = path.length === 4 ? path[3] : undefined;
  const [fields, labels, quota, rules] = await Promise.all([
    buildRegionFields(path),
    getRegionFilterLabels(),
    village ? getVillageQuota(village.code) : Promise.resolve(null),
    getQuotaRules(),
  ]);
  const area = path
    .slice(1, 3)
    .reverse()
    .map((region) => region.name)
    .join(", ");

  const selected: SelectedVillage | null =
    village && quota
      ? {
          code: village.code,
          name: village.name,
          area,
          status: quota.status,
          remaining: quota.remaining,
        }
      : null;

  return (
    <UrlStateShell pathname="/kemitraan">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8">
        <div className="flex flex-col gap-5 rounded-3xl border border-border/60 bg-card p-5 shadow-card sm:p-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-h4 text-foreground">{t("title")}</h3>
            <p className="text-body-sm text-muted-foreground">{t("hint")}</p>
          </div>
          <RegionFilter
            action={getPathname({ href: "/kemitraan", locale })}
            fields={fields}
            keep={{}}
            labels={labels}
            idPrefix="quota"
          />
          <PendingRegion>
            {village && quota ? (
              <QuotaResult key={village.code} village={village} area={area} quota={quota} />
            ) : (
              <QuotaResult village={null} max={rules.unitsPerVillage} />
            )}
          </PendingRegion>
        </div>

        <div id="daftar" className="scroll-mt-20">
          <PartnerForm village={selected} />
        </div>
      </div>
    </UrlStateShell>
  );
}
