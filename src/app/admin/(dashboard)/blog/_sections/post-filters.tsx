import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { firstParam, listHref, pageParam } from "@/components/admin/list-href";
import { ListSearch } from "@/components/admin/list-search";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import type { AdminPostFilter, AdminPostList } from "@/features/blog/admin-queries";
import { postStatuses, type PostStatus } from "@/features/blog/schema";
import { cn } from "@/lib/utils";

type Params = Record<string, string | string[] | undefined>;

/** `?q=&status=&page=` → a valid filter. */
export function readPostFilter(params: Params): AdminPostFilter {
  const status = firstParam(params.status);
  return {
    query: (firstParam(params.q) ?? "").slice(0, 80),
    status: postStatuses.includes(status as PostStatus) ? (status as PostStatus) : null,
    page: pageParam(params.page),
  };
}

/** List URL for a filter; changing the search or status goes back to page 1. */
export function postListHref({ query, status, page }: Partial<AdminPostFilter>): string {
  return listHref(adminRoutes.blog, { q: query, status, page });
}

/** Search-as-you-type by title and status chips with counts. */
export async function PostFilters({
  filter,
  counts,
}: {
  filter: AdminPostFilter;
  counts: AdminPostList["counts"];
}) {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminBlog" });
  const chips = [null, ...postStatuses] as const;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <ListSearch
        action={adminRoutes.blog}
        defaultValue={filter.query}
        label={t("search")}
        placeholder={t("searchPlaceholder")}
        hiddenParams={filter.status ? { status: filter.status } : {}}
        className="lg:max-w-md"
      />
      <nav aria-label={t("filters.label")} className="-mx-1 overflow-x-auto px-1 pb-1">
        <ul className="flex w-max gap-2">
          {chips.map((status) => {
            const active = filter.status === status;
            return (
              <li key={status ?? "all"}>
                <Link
                  href={postListHref({ query: filter.query, status })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-body-sm font-semibold whitespace-nowrap transition-colors duration-(--duration-fast)",
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
                    {counts[status ?? "all"]}
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
