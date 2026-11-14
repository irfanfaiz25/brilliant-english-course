import { getTranslations } from "next-intl/server";

import { firstParam, listHref, pageParam } from "@/components/admin/list-href";
import { FilterChips } from "@/components/admin/filter-chips";
import { ListSearch } from "@/components/admin/list-search";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import type { MediaFilter, MediaLibrary } from "@/features/media/admin-queries";

type Params = Record<string, string | string[] | undefined>;

/** `?q=&unused=1&page=` → a valid filter. */
export function readMediaFilter(params: Params): MediaFilter {
  return {
    query: (firstParam(params.q) ?? "").slice(0, 80),
    unused: firstParam(params.unused) === "1",
    page: pageParam(params.page),
  };
}

/** Library URL for a filter; changing the search or chip goes back to page 1. */
export function mediaListHref({ query, unused, page }: Partial<MediaFilter>): string {
  return listHref(adminRoutes.media, { q: query, unused, page });
}

/** Search by name (a plain GET form) and the "all / not used yet" chips with counts. */
export async function MediaFilters({
  filter,
  counts,
}: {
  filter: MediaFilter;
  counts: MediaLibrary["counts"];
}) {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminMedia" });
  const chips = [
    { unused: false, label: t("filters.all"), count: counts.all },
    { unused: true, label: t("filters.unused"), count: counts.unused },
  ];

  return (
    // Laid out by the panel's width (it sits beside the uploader from `xl`).
    <div className="flex flex-col gap-3 @2xl:flex-row @2xl:items-center @2xl:justify-between">
      <ListSearch
        action={adminRoutes.media}
        defaultValue={filter.query}
        label={t("search")}
        placeholder={t("searchPlaceholder")}
        hiddenParams={filter.unused ? { unused: "1" } : {}}
        className="@2xl:max-w-sm"
      />

      <FilterChips
        label={t("filters.label")}
        chips={chips.map((chip) => ({
          key: String(chip.unused),
          label: chip.label,
          count: chip.count,
          href: mediaListHref({ query: filter.query, unused: chip.unused }),
          active: filter.unused === chip.unused,
        }))}
      />
    </div>
  );
}
