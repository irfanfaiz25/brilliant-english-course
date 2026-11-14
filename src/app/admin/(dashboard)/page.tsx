import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { requireUser } from "@/features/users/session";
import { canAccessAdmin } from "@/lib/permissions";

import { KpiCards } from "./_overview/kpi-cards";
import { LatestLeads } from "./_overview/latest-leads";
import { Shortcuts } from "./_overview/shortcuts";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return { title: t("overview.title") };
}

/**
 * Ringkasan (DESIGN.md § 6): KPI cards, the latest partner applications and shortcuts, each
 * shown only to roles that may read the underlying data. Everything below the title reads the
 * session, so it streams in behind one boundary.
 */
export default async function AdminOverviewPage() {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return (
    <>
      <AdminPageHeader
        breadcrumbs={false}
        title={t("overview.title")}
        description={t("overview.description")}
      />
      <Suspense fallback={<OverviewSkeleton />}>
        <OverviewContent />
      </Suspense>
    </>
  );
}

async function OverviewContent() {
  const [user, t] = await Promise.all([
    requireUser(adminRoutes.home),
    getTranslations({ locale: adminLocale, namespace: "Admin" }),
  ]);

  if (!canAccessAdmin(user)) {
    return (
      <p className="rounded-2xl surface-glass-panel p-6 text-body text-muted-foreground">
        {t("noAccess")}
      </p>
    );
  }

  return (
    <>
      <p className="text-h5 text-foreground">{t("greeting", { name: user.name })}</p>
      <KpiCards user={user} />
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <LatestLeads user={user} />
        <Shortcuts user={user} />
      </div>
    </>
  );
}

function OverviewSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <Skeleton className="h-7 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}
