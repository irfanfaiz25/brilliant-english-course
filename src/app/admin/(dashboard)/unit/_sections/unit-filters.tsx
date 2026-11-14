import { getTranslations } from "next-intl/server";

import { FilterChips } from "@/components/admin/filter-chips";
import { ListSearch } from "@/components/admin/list-search";
import { listHref } from "@/components/admin/list-href";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import type { AdminUnitFilter, AdminUnitList } from "@/features/units/admin-queries";
import { unitStatuses } from "@/features/units/schema";

/** List URL for a filter; the page resets whenever the search or status changes. */
export function unitListHref({ query, status, page }: Partial<AdminUnitFilter>): string {
  return listHref(adminRoutes.units, { q: query, status, page });
}

/**
 * Search box (a plain GET form, works without JS) and status chips with live counts. The chips
 * keep the search; the search keeps the status.
 */
export async function UnitFilters({
  filter,
  counts,
}: {
  filter: AdminUnitFilter;
  counts: AdminUnitList["counts"];
}) {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminUnits" });
  const chips = [null, ...unitStatuses] as const;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <ListSearch
        action={adminRoutes.units}
        defaultValue={filter.query}
        label={t("search")}
        placeholder={t("searchPlaceholder")}
        hiddenParams={filter.status ? { status: filter.status } : {}}
        className="lg:max-w-md"
      />

      <FilterChips
        label={t("filters.label")}
        chips={chips.map((status) => ({
          key: status ?? "all",
          label: status ? t(`status.${status}`) : t("filters.all"),
          count: counts[status ?? "all"],
          href: unitListHref({ query: filter.query, status }),
          active: filter.status === status,
        }))}
      />
    </div>
  );
}
