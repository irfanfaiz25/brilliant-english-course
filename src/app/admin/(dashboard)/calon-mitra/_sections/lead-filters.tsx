import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { chipClass, FilterChips } from "@/components/admin/filter-chips";
import { ListSearch } from "@/components/admin/list-search";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import type { LeadFilter, PipelineList } from "@/features/partners/admin-queries";
import { leadStatuses } from "@/features/partners/schema";

import { leadListHref } from "./lead-filter";

/**
 * Search (a plain GET form) plus the pipeline as chips with live counts, and an "assigned to me"
 * toggle. Every link keeps the rest of the filter.
 */
export async function LeadFilters({
  filter,
  counts,
}: {
  filter: LeadFilter;
  counts: PipelineList["counts"];
}) {
  const [t, tStatus] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminLeads" }),
    getTranslations({ locale: adminLocale, namespace: "Admin.leadStatus" }),
  ]);
  const chips = [
    { key: null, label: t("filters.all"), count: counts.all },
    { key: "open" as const, label: t("filters.open"), count: counts.open },
    ...leadStatuses.map((status) => ({
      key: status,
      label: tStatus(status),
      count: counts[status],
    })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ListSearch
          action={adminRoutes.leads}
          defaultValue={filter.query}
          label={t("search")}
          placeholder={t("searchPlaceholder")}
          hiddenParams={{
            ...(filter.status ? { status: filter.status } : {}),
            ...(filter.mine ? { mine: "1" } : {}),
          }}
          className="sm:max-w-md"
        />
        <Link
          href={leadListHref({ ...filter, mine: !filter.mine, page: 1 })}
          aria-pressed={filter.mine}
          className={chipClass(filter.mine)}
        >
          {t("filters.mine")}
        </Link>
      </div>

      <FilterChips
        label={t("filters.label")}
        chips={chips.map((chip) => ({
          key: chip.key ?? "all",
          label: chip.label,
          count: chip.count,
          href: leadListHref({ ...filter, status: chip.key, page: 1 }),
          active: filter.status === chip.key,
        }))}
        wrap
      />
    </div>
  );
}
