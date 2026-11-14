import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { firstParam } from "@/components/admin/list-href";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { parseTrendRange } from "@/features/partners/trend";
import { requireUser } from "@/features/users/session";
import { can, canAccessAdmin } from "@/lib/permissions";

import { ActionItems } from "./_overview/action-items";
import { KpiCards } from "./_overview/kpi-cards";
import { LatestLeads } from "./_overview/latest-leads";
import { LeadPipeline } from "./_overview/lead-pipeline";
import { LeadTrendPanel } from "./_overview/lead-trend";
import { RecentActivity } from "./_overview/recent-activity";
import { RegionDemandPanel } from "./_overview/region-demand";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return { title: t("overview.title") };
}

/**
 * Ringkasan (Phase 4h, ADR-037): what needs action, the headline numbers, the partner-lead trend,
 * pipeline and regional demand, the latest leads and the activity log. Every section shows only to
 * roles that may read its data. Everything below the title reads the session (and `?range=`), so
 * it streams in behind one boundary.
 */
export default async function AdminOverviewPage({ searchParams }: PageProps<"/admin">) {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return (
    <>
      <AdminPageHeader
        breadcrumbs={false}
        title={t("overview.title")}
        description={t("overview.description")}
      />
      <Suspense fallback={<OverviewSkeleton />}>
        <OverviewContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function OverviewContent({
  searchParams,
}: {
  searchParams: PageProps<"/admin">["searchParams"];
}) {
  const [user, t, params] = await Promise.all([
    requireUser(adminRoutes.home),
    getTranslations({ locale: adminLocale, namespace: "Admin" }),
    searchParams,
  ]);

  if (!canAccessAdmin(user)) {
    return (
      <p className="rounded-2xl surface-glass-panel p-6 text-body text-muted-foreground">
        {t("noAccess")}
      </p>
    );
  }
  const readsLeads = can(user, "read", "leads");
  const readsActivity = can(user, "read", "auditLog");

  return (
    <div className="flex flex-col gap-6">
      <p className="text-h5 text-foreground">{t("greeting", { name: user.name })}</p>
      <ActionItems user={user} />
      <KpiCards user={user} />
      {readsLeads && (
        <>
          <LeadTrendPanel user={user} range={parseTrendRange(firstParam(params.range))} />
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
            <LeadPipeline user={user} />
            <RegionDemandPanel user={user} />
          </div>
        </>
      )}
      {(readsLeads || readsActivity) && (
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {readsLeads && <LatestLeads user={user} />}
          {readsActivity && <RecentActivity user={user} />}
        </div>
      )}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-32 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-36 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
