import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPanel } from "@/components/admin/admin-panel";
import { ListPagination } from "@/components/admin/list-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { getMediaLibrary } from "@/features/media/admin-queries";
import { requirePermission } from "@/features/users/session";
import { can } from "@/lib/permissions";

import { LibraryUploader } from "./_sections/library-uploader";
import { MediaFilters, mediaListHref, readMediaFilter } from "./_sections/media-filters";
import { MediaGrid } from "./_sections/media-grid";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return { title: t("nav.items.media") };
}

/**
 * Media (Phase 4e): the image library with search, a "not used yet" filter and uploads with live
 * progress. From `xl` the uploader is a sticky column beside the grid; below it comes first.
 */
export default async function MediaPage({ searchParams }: PageProps<"/admin/media">) {
  const [tNav, t] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "Admin.nav.items" }),
    getTranslations({ locale: adminLocale, namespace: "AdminMedia" }),
  ]);
  return (
    <>
      <AdminPageHeader breadcrumbs={[]} title={tNav("media")} description={t("description")} />
      <Suspense fallback={<Skeleton aria-hidden className="h-[36rem] rounded-2xl" />}>
        <Library searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Library({
  searchParams,
}: {
  searchParams: PageProps<"/admin/media">["searchParams"];
}) {
  const user = await requirePermission("read", "media", adminRoutes.media);
  const filter = readMediaFilter(await searchParams);
  const [t, library] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminMedia" }),
    getMediaLibrary(user, filter),
  ]);
  const canUpload = can(user, "create", "media");

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      {canUpload && (
        <AdminPanel
          title={t("upload.title")}
          className="xl:sticky xl:top-24 xl:col-start-2 xl:row-start-1"
        >
          <LibraryUploader />
        </AdminPanel>
      )}
      <section
        aria-label={t("libraryLabel")}
        className="@container flex flex-col gap-5 rounded-2xl surface-glass-panel p-4 sm:p-6 xl:col-start-1 xl:row-start-1"
      >
        <MediaFilters filter={filter} counts={library.counts} />
        <p className="text-body-sm text-muted-foreground" aria-live="polite">
          {t("count", { count: library.total })}
        </p>
        <MediaGrid items={library.items} filtered={filter.query !== "" || filter.unused} />
        <ListPagination
          page={filter.page}
          pageCount={library.pageCount}
          hrefFor={(page) => mediaListHref({ ...filter, page })}
          label={t("pagination.label")}
        />
      </section>
    </div>
  );
}
