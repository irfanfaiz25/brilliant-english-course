import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { firstParam, listHref, pageParam } from "@/components/admin/list-href";
import { ListSearch } from "@/components/admin/list-search";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import type { MediaFilter, MediaLibrary } from "@/features/media/admin-queries";
import { cn } from "@/lib/utils";

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

      <nav aria-label={t("filters.label")}>
        <ul className="flex gap-2">
          {chips.map((chip) => {
            const active = filter.unused === chip.unused;
            return (
              <li key={String(chip.unused)}>
                <Link
                  href={mediaListHref({ query: filter.query, unused: chip.unused })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-body-sm font-semibold whitespace-nowrap transition-colors duration-(--duration-fast)",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/60",
                  )}
                >
                  {chip.label}
                  <span
                    className={cn(
                      "rounded-full px-2 text-caption",
                      active ? "bg-white/20" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {chip.count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
