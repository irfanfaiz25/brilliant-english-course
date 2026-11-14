import { DownloadIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ListPagination } from "@/components/admin/list-pagination";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { getPipeline } from "@/features/partners/admin-queries";
import { requirePermission } from "@/features/users/session";

import { leadListHref, readLeadFilter } from "./_sections/lead-filter";
import { LeadFilters } from "./_sections/lead-filters";
import { LeadList } from "./_sections/lead-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return { title: t("nav.items.leads") };
}

type SearchParams = PageProps<"/admin/calon-mitra">["searchParams"];

/** Calon Mitra (Phase 4d): the partner pipeline with search, stage chips, paging and export. */
export default async function LeadsPage({ searchParams }: PageProps<"/admin/calon-mitra">) {
  const [tNav, t] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "Admin.nav.items" }),
    getTranslations({ locale: adminLocale, namespace: "AdminLeads" }),
  ]);
  return (
    <>
      <AdminPageHeader breadcrumbs={[]} title={tNav("leads")} description={t("description")} />
      <Suspense fallback={<Skeleton aria-hidden className="h-[32rem] rounded-2xl" />}>
        <Pipeline searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Pipeline({ searchParams }: { searchParams: SearchParams }) {
  const user = await requirePermission("read", "leads", adminRoutes.leads);
  const filter = readLeadFilter(await searchParams);
  const [t, pipeline] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminLeads" }),
    getPipeline(user, filter),
  ]);

  return (
    <section className="flex flex-col gap-5 rounded-2xl surface-glass-panel p-4 sm:p-6">
      <LeadFilters filter={filter} counts={pipeline.counts} />
      <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
        <p className="text-body-sm text-muted-foreground" aria-live="polite">
          {t("pagination.count", { count: pipeline.total })}
        </p>
        {pipeline.total > 0 && (
          <Button asChild variant="ghost" size="sm">
            {/* A route handler, not a page: a plain link downloads the file. */}
            <a href={leadListHref({ ...filter, page: 1 }, adminRoutes.leadExport)} download>
              <DownloadIcon aria-hidden />
              {t("export")}
            </a>
          </Button>
        )}
      </div>
      <LeadList
        leads={pipeline.rows}
        filtered={filter.query !== "" || filter.status !== null || filter.mine}
      />
      <ListPagination
        page={filter.page}
        pageCount={pipeline.pageCount}
        hrefFor={(page) => leadListHref({ ...filter, page })}
        label={t("pagination.label")}
      />
    </section>
  );
}
