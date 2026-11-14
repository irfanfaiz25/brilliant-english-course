import { SearchIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import type { LeadFilter, PipelineList } from "@/features/partners/admin-queries";
import { leadStatuses } from "@/features/partners/schema";
import { cn } from "@/lib/utils";

import { leadListHref } from "./lead-filter";

const chipClass = (active: boolean) =>
  cn(
    "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-body-sm font-semibold whitespace-nowrap transition-colors duration-(--duration-fast)",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-background text-foreground hover:border-primary/60",
  );

const countClass = (active: boolean) =>
  cn("rounded-full px-2 text-caption", active ? "bg-white/20" : "bg-muted text-muted-foreground");

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
        <form
          role="search"
          action={adminRoutes.leads}
          method="get"
          className="flex w-full gap-2 sm:max-w-md"
        >
          {filter.status && <input type="hidden" name="status" value={filter.status} />}
          {filter.mine && <input type="hidden" name="mine" value="1" />}
          <label htmlFor="lead-search" className="sr-only">
            {t("search")}
          </label>
          <div className="relative flex-1">
            <SearchIcon
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="lead-search"
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
        <Link
          href={leadListHref({ ...filter, mine: !filter.mine, page: 1 })}
          aria-pressed={filter.mine}
          className={chipClass(filter.mine)}
        >
          {t("filters.mine")}
        </Link>
      </div>

      {/* Scrolls sideways on phones; wraps where there is room. */}
      <nav aria-label={t("filters.label")} className="-mx-1 overflow-x-auto px-1 pb-1">
        <ul className="flex w-max gap-2 lg:w-auto lg:flex-wrap">
          {chips.map((chip) => {
            const active = filter.status === chip.key;
            return (
              <li key={chip.key ?? "all"}>
                <Link
                  href={leadListHref({ ...filter, status: chip.key, page: 1 })}
                  aria-current={active ? "page" : undefined}
                  className={chipClass(active)}
                >
                  {chip.label}
                  <span className={countClass(active)}>{chip.count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
