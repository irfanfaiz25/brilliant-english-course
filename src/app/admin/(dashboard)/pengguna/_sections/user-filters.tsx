import { getTranslations } from "next-intl/server";

import { FilterChips } from "@/components/admin/filter-chips";
import { firstParam, listHref, pageParam } from "@/components/admin/list-href";
import { ListSearch } from "@/components/admin/list-search";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import type { AdminUserFilter, AdminUserList } from "@/features/users/admin-queries";
import { userRoles, type UserRole } from "@/features/users/schema";

type Params = Record<string, string | string[] | undefined>;

/** `?q=&role=&page=` → a valid filter. */
export function readUserFilter(params: Params): AdminUserFilter {
  const role = firstParam(params.role);
  return {
    query: (firstParam(params.q) ?? "").trim().slice(0, 80),
    role: userRoles.includes(role as UserRole) ? (role as UserRole) : null,
    page: pageParam(params.page),
  };
}

/** List URL for a filter; changing the search or role goes back to page 1. */
export function userListHref({ query, role, page }: Partial<AdminUserFilter>): string {
  return listHref(adminRoutes.users, { q: query, role, page });
}

/** Search-as-you-type by name or email, and role chips with counts. */
export async function UserFilters({
  filter,
  counts,
}: {
  filter: AdminUserFilter;
  counts: AdminUserList["counts"];
}) {
  const [t, tRole] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminUsers" }),
    getTranslations({ locale: adminLocale, namespace: "Admin.role" }),
  ]);
  const chips = [null, ...userRoles] as const;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <ListSearch
        action={adminRoutes.users}
        defaultValue={filter.query}
        label={t("search")}
        placeholder={t("searchPlaceholder")}
        hiddenParams={filter.role ? { role: filter.role } : {}}
        className="lg:max-w-md"
      />
      <FilterChips
        label={t("filters.label")}
        chips={chips.map((role) => ({
          key: role ?? "all",
          label: role ? tRole(role) : t("filters.all"),
          count: counts[role ?? "all"],
          href: userListHref({ query: filter.query, role }),
          active: filter.role === role,
        }))}
      />
    </div>
  );
}
