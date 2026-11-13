import { XIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import type { CSSProperties } from "react";

import { CopyLinkButton } from "@/components/site/copy-link-button";
import { PendingRegion, UrlStateShell } from "@/components/site/url-state-shell";
import { Separator } from "@/components/ui/separator";
import { RegionFilter } from "@/features/regions/components/region-filter";
import { buildRegionFields, getRegionFilterLabels } from "@/features/regions/fields";
import { getRegionPath } from "@/features/regions/queries";
import type { Region } from "@/features/regions/schema";
import { UnitCard } from "@/features/units/components/unit-card";
import { finderQuery, parseFinderParams, type FinderParams } from "@/features/units/finder-params";
import { getActiveUnits } from "@/features/units/queries";
import { searchUnits } from "@/features/units/service";
import { getPathname, Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/seo/absolute-url";
import { itemListJsonLd, JsonLd, localBusinessJsonLd } from "@/lib/seo/json-ld";

import { FinderEmptyState } from "./finder-empty-state";
import { LocationButton } from "./location-button";
import { MobileFilterSheet } from "./mobile-filter-sheet";
import { SearchBox } from "./search-box";

const SCHEMA_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
/** Delay between result cards rising in (CSS), capped so long lists don't drag. */
const CARD_STAGGER_MS = 60;
const MAX_STAGGERED_CARDS = 6;

/**
 * The unit finder: reads the URL state, resolves the region cascade and results on the server,
 * and hands interactive bits (search, location, selects) to small client components.
 */
export async function Finder({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/cek-unit">["searchParams"];
}) {
  const t = await getTranslations("Finder");
  const locale = (await getLocale()) as Locale;
  const params = parseFinderParams(await searchParams);

  const [units, path] = await Promise.all([
    getActiveUnits(),
    params.regionCode ? getRegionPath(params.regionCode) : Promise.resolve([] as Region[]),
  ]);
  // Unknown region codes are ignored rather than producing an empty, confusing result.
  const regionCode = path.length > 0 ? params.regionCode : undefined;
  const region = path.at(-1);
  const results = searchUnits(units, { query: params.query, regionCode, near: params.near });

  const [fields, regionLabels] = await Promise.all([
    buildRegionFields(path),
    getRegionFilterLabels(),
  ]);
  const action = getPathname({ href: "/cek-unit", locale });
  const keepForRegion = finderQuery({ query: params.query });
  const keepForSearch = finderQuery({ regionCode, near: params.near });
  const distanceFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });

  const countText = params.query
    ? t("results.countQuery", { count: results.length, query: params.query })
    : region
      ? t("results.countIn", { count: results.length, area: region.name })
      : t("results.countAll", { count: results.length });

  const searchBox = (idPrefix: string) => (
    <SearchBox
      action={action}
      defaultValue={params.query ?? ""}
      keep={keepForSearch}
      idPrefix={idPrefix}
      labels={{
        label: t("filters.searchLabel"),
        placeholder: t("filters.searchPlaceholder"),
        submit: t("filters.searchSubmit"),
        clear: t("results.clearAll"),
      }}
    />
  );
  const locationButton = (
    <LocationButton
      active={Boolean(params.near)}
      highlight={params.wantsLocation}
      keep={{ query: params.query }}
      labels={{
        use: t("filters.useLocation"),
        locating: t("filters.locating"),
        active: t("filters.locationActive"),
        clear: t("filters.clearLocation"),
        hint: t("filters.locationHint"),
        denied: t("filters.locationDenied"),
        unavailable: t("filters.locationUnavailable"),
      }}
    />
  );

  return (
    <UrlStateShell pathname="/cek-unit">
      <div className="grid gap-6 lg:grid-cols-[22rem_1fr] lg:gap-10">
        {/* Desktop: everything in a sticky side panel. */}
        <aside aria-label={t("filters.panelLabel")} className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-5 rounded-2xl border border-border/60 bg-card p-5 shadow-card">
            {searchBox("desktop")}
            {locationButton}
            <Separator />
            <RegionFilter
              action={action}
              fields={fields}
              keep={keepForRegion}
              labels={regionLabels}
              idPrefix="desktop"
            />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-5">
          {/* Phones/tablets: search first, location and the region sheet side by side. */}
          <div
            role="group"
            aria-label={t("filters.panelLabel")}
            className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-card lg:hidden"
          >
            {searchBox("mobile")}
            <div className="grid gap-3 sm:grid-cols-2">
              {locationButton}
              <MobileFilterSheet
                action={action}
                fields={fields}
                keep={keepForRegion}
                activeCount={path.length}
                labels={{
                  ...regionLabels,
                  open: t("filters.openFilters"),
                  activeCount: t("filters.activeCount", { count: path.length }),
                  description: t("hero.note"),
                  showResults: t("filters.showResults"),
                }}
              />
            </div>
          </div>

          <ActiveFilters params={{ ...params, regionCode }} region={region} />

          <PendingRegion className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3">
              <div aria-live="polite" className="flex flex-col gap-0.5">
                <p className="text-h5 text-foreground">{countText}</p>
                {results.length > 0 && (
                  <p className="text-caption text-muted-foreground">
                    {params.near ? t("results.sortedByDistance") : t("results.sortedByName")}
                  </p>
                )}
              </div>
              {results.length > 0 && (
                <CopyLinkButton
                  labels={{
                    share: t("results.share"),
                    copied: t("results.copied"),
                    failed: t("results.copyFailed"),
                  }}
                />
              )}
            </div>

            {results.length > 0 ? (
              <>
                <JsonLd
                  data={itemListJsonLd(
                    results.map((unit) =>
                      localBusinessJsonLd({
                        name: `Brilliant English Course — ${unit.name}`,
                        url: absoluteUrl(getPathname({ href: "/cek-unit", locale })),
                        telephone: `+${unit.whatsapp}`,
                        streetAddress: unit.address,
                        locality: unit.regency,
                        region: path[0]?.name,
                        geo: unit.location,
                        openDays: unit.openDays.map((day) => SCHEMA_DAYS[day - 1] ?? "Monday"),
                        opens: unit.opensAt,
                        closes: unit.closesAt,
                      }),
                    ),
                  )}
                />
                <ul className="grid gap-4 md:grid-cols-2">
                  {results.map((unit, index) => (
                    <li
                      key={unit.code}
                      style={
                        {
                          animationDelay: `${Math.min(index, MAX_STAGGERED_CARDS) * CARD_STAGGER_MS}ms`,
                        } as CSSProperties
                      }
                      className="animate-rise-in"
                    >
                      <UnitCard
                        unit={unit}
                        distanceLabel={
                          unit.distanceKm === undefined
                            ? undefined
                            : t("results.distance", {
                                distance: distanceFormat.format(unit.distanceKm),
                              })
                        }
                      />
                    </li>
                  ))}
                </ul>
              </>
            ) : region ? (
              <FinderEmptyState kind="region" region={region} widerRegion={path.at(-2) ?? null} />
            ) : (
              <FinderEmptyState kind="query" query={params.query ?? ""} />
            )}
          </PendingRegion>
        </div>
      </div>
    </UrlStateShell>
  );
}

/** Removable chips for each active filter, as plain links (work without JS). */
async function ActiveFilters({ params, region }: { params: FinderParams; region?: Region }) {
  const t = await getTranslations("Finder.results");
  const chips = [
    region && {
      key: "region",
      label: region.name,
      query: finderQuery({ ...params, regionCode: undefined }),
    },
    params.query && {
      key: "query",
      label: `“${params.query}”`,
      query: finderQuery({ ...params, query: undefined }),
    },
    params.near && {
      key: "near",
      label: t("location"),
      query: finderQuery({ ...params, near: undefined }),
    },
  ].filter((chip): chip is { key: string; label: string; query: Record<string, string> } =>
    Boolean(chip),
  );

  if (chips.length === 0) return null;

  return (
    <nav aria-label={t("activeFilters")} className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={{ pathname: "/cek-unit", query: chip.query }}
          scroll={false}
          aria-label={t("removeFilter", { label: chip.label })}
          className="group inline-flex animate-rise-in items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft py-1.5 pr-2 pl-3.5 text-label text-primary transition-colors duration-(--duration-fast) hover:border-primary"
        >
          {chip.label}
          <span className="inline-flex size-5 items-center justify-center rounded-full transition-colors duration-(--duration-fast) group-hover:bg-primary group-hover:text-primary-foreground">
            <XIcon aria-hidden className="size-3.5" />
          </span>
        </Link>
      ))}
      {chips.length > 1 && (
        <Link
          href="/cek-unit"
          scroll={false}
          className="rounded-full px-3 py-1.5 text-label text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t("clearAll")}
        </Link>
      )}
    </nav>
  );
}
