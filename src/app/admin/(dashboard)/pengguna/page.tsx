import { UserPlusIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ListPagination } from "@/components/admin/list-pagination";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { getAdminUsers } from "@/features/users/admin-queries";
import { requirePermission } from "@/features/users/session";
import { can } from "@/lib/permissions";

import { RoleMatrix } from "./_sections/role-matrix";
import { readUserFilter, UserFilters, userListHref } from "./_sections/user-filters";
import { UserList } from "./_sections/user-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return { title: t("nav.items.users") };
}

/**
 * Pengguna (Phase 4g): every account with search and role chips, and the permission matrix.
 * Admins may read the list; only super admins add or open accounts.
 */
export default async function UsersPage({ searchParams }: PageProps<"/admin/pengguna">) {
  const [tNav, t] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "Admin.nav.items" }),
    getTranslations({ locale: adminLocale, namespace: "AdminUsers" }),
  ]);
  return (
    <>
      <AdminPageHeader
        breadcrumbs={[]}
        title={tNav("users")}
        description={t("description")}
        actions={
          <Suspense fallback={null}>
            <AddButton />
          </Suspense>
        }
      />
      <div className="flex flex-col gap-6">
        <Suspense fallback={<Skeleton aria-hidden className="h-[28rem] rounded-2xl" />}>
          <Users searchParams={searchParams} />
        </Suspense>
        <Suspense fallback={<Skeleton aria-hidden className="h-96 rounded-2xl" />}>
          <Matrix />
        </Suspense>
      </div>
    </>
  );
}

async function AddButton() {
  const user = await requirePermission("read", "users", adminRoutes.users);
  if (!can(user, "create", "users")) return null;
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminUsers" });
  return (
    <Button asChild>
      <Link href={adminRoutes.newUser}>
        <UserPlusIcon aria-hidden />
        {t("add")}
      </Link>
    </Button>
  );
}

async function Users({
  searchParams,
}: {
  searchParams: PageProps<"/admin/pengguna">["searchParams"];
}) {
  const user = await requirePermission("read", "users", adminRoutes.users);
  const filter = readUserFilter(await searchParams);
  const [t, list] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminUsers" }),
    getAdminUsers(user, filter),
  ]);

  return (
    <section
      aria-label={t("listLabel")}
      className="flex flex-col gap-5 rounded-2xl surface-glass-panel p-4 sm:p-6"
    >
      <UserFilters filter={filter} counts={list.counts} />
      <p className="text-body-sm text-muted-foreground" aria-live="polite">
        {t("count", { count: list.total })}
      </p>
      <UserList
        rows={list.rows}
        filtered={filter.query !== "" || filter.role !== null}
        canManage={can(user, "update", "users")}
        currentUserId={user.id}
      />
      <ListPagination
        page={filter.page}
        pageCount={list.pageCount}
        hrefFor={(page) => userListHref({ ...filter, page })}
        label={t("pagination.label")}
      />
    </section>
  );
}

async function Matrix() {
  await requirePermission("read", "users", adminRoutes.users);
  return <RoleMatrix />;
}
