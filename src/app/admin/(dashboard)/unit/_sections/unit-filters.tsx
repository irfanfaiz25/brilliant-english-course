import { SearchIcon, XIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { listHref } from "@/components/admin/list-href";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import type { AdminUnitFilter, AdminUnitList } from "@/features/units/admin-queries";
import { unitStatuses } from "@/features/units/schema";
import { cn } from "@/lib/utils";

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
      <form
        role="search"
        action={adminRoutes.units}
        method="get"
        className="flex w-full gap-2 lg:max-w-md"
      >
        {filter.status && <input type="hidden" name="status" value={filter.status} />}
        <label htmlFor="unit-search" className="sr-only">
          {t("search")}
        </label>
        <div className="relative flex-1">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="unit-search"
            type="search"
            name="q"
            defaultValue={filter.query}
            placeholder={t("searchPlaceholder")}
            className="pl-11"
          />
        </div>
        <Button type="submit" variant="secondary">
          {t("searchSubmit")}
        </Button>
      </form>

      <nav aria-label={t("filters.label")} className="-mx-1 overflow-x-auto px-1 pb-1">
        <ul className="flex w-max gap-2">
          {chips.map((status) => {
            const active = filter.status === status;
            const count = counts[status ?? "all"];
            return (
              <li key={status ?? "all"}>
                <Link
                  href={unitListHref({ query: filter.query, status })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-body-sm font-semibold transition-colors duration-(--duration-fast)",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/60",
                  )}
                >
                  {status ? t(`status.${status}`) : t("filters.all")}
                  <span
                    className={cn(
                      "rounded-full px-2 text-caption",
                      active ? "bg-white/20" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {filter.query && (
        <Link
          href={unitListHref({ status: filter.status })}
          className="inline-flex w-fit items-center gap-1.5 rounded-md text-body-sm font-semibold text-primary lg:hidden"
        >
          <XIcon aria-hidden className="size-4" />
          {t("clearSearch")}
        </Link>
      )}
    </div>
  );
}
