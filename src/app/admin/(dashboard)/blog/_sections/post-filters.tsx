import { getTranslations } from "next-intl/server";

import { firstParam, listHref, pageParam } from "@/components/admin/list-href";
import { FilterChips } from "@/components/admin/filter-chips";
import { ListSearch } from "@/components/admin/list-search";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import type { AdminPostFilter, AdminPostList } from "@/features/blog/admin-queries";
import { postStatuses, type PostStatus } from "@/features/blog/schema";

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
      <FilterChips
        label={t("filters.label")}
        chips={chips.map((status) => ({
          key: status ?? "all",
          label: status ? t(`status.${status}`) : t("filters.all"),
          count: counts[status ?? "all"],
          href: postListHref({ query: filter.query, status }),
          active: filter.status === status,
        }))}
      />
    </div>
  );
}
