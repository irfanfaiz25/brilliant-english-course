import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { firstParam, pageParam } from "@/components/admin/list-href";
import { ListPagination } from "@/components/admin/list-pagination";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { getAdminUnits } from "@/features/units/admin-queries";
import { unitStatuses, type UnitStatus } from "@/features/units/schema";
import { requirePermission } from "@/features/users/session";
import { can } from "@/lib/permissions";

import { UnitFilters, unitListHref } from "./_sections/unit-filters";
import { UnitList } from "./_sections/unit-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return { title: t("nav.items.units") };
}

type SearchParams = PageProps<"/admin/unit">["searchParams"];

/** Unit Mitra (Phase 4c): searchable, filterable list of the partner units. */
export default async function UnitsPage({ searchParams }: PageProps<"/admin/unit">) {
  const [tNav, t] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "Admin.nav.items" }),
    getTranslations({ locale: adminLocale, namespace: "AdminUnits" }),
  ]);
  return (
    <>
      <AdminPageHeader
        title={tNav("units")}
        description={t("description")}
        actions={
          <Suspense fallback={null}>
            <AddButton />
          </Suspense>
        }
      />
      <Suspense fallback={<ListSkeleton />}>
        <Units searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function AddButton() {
  const user = await requirePermission("read", "units", adminRoutes.units);
  if (!can(user, "create", "units")) return null;
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminUnits" });
  return (
    <Button asChild>
      <Link href={adminRoutes.newUnit}>
        <PlusIcon aria-hidden />
        {t("add")}
      </Link>
    </Button>
  );
}

/** `?q=&status=&page=` → a valid filter; anything unexpected falls back to the defaults. */
function readFilter(params: Awaited<SearchParams>) {
  const status = firstParam(params.status);
  return {
    query: (firstParam(params.q) ?? "").slice(0, 80),
    status: unitStatuses.includes(status as UnitStatus) ? (status as UnitStatus) : null,
    page: pageParam(params.page),
  };
}

async function Units({ searchParams }: { searchParams: SearchParams }) {
  const user = await requirePermission("read", "units", adminRoutes.units);
  const filter = readFilter(await searchParams);
  const [t, list] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminUnits" }),
    getAdminUnits(user, filter),
  ]);

  return (
    <section className="flex flex-col gap-5 rounded-2xl surface-glass-panel p-4 sm:p-6">
      <UnitFilters filter={filter} counts={list.counts} />
      <UnitList
        rows={list.rows}
        filtered={filter.query !== "" || filter.status !== null}
        canUpdate={can(user, "update", "units")}
        canDelete={can(user, "delete", "units")}
      />
      <ListPagination
        page={filter.page}
        pageCount={list.pageCount}
        hrefFor={(page) => unitListHref({ ...filter, page })}
        label={t("pagination.label")}
      />
    </section>
  );
}

function ListSkeleton() {
  return <Skeleton aria-hidden className="h-[32rem] rounded-2xl" />;
}
