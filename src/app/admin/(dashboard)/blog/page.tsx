import { PenLineIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ListPagination } from "@/components/admin/list-pagination";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { getAdminPosts } from "@/features/blog/admin-queries";
import { postCategoryLabels } from "@/features/blog/admin-labels";
import { requirePermission } from "@/features/users/session";
import { can } from "@/lib/permissions";

import { PostFilters, postListHref, readPostFilter } from "./_sections/post-filters";
import { PostList } from "./_sections/post-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return { title: t("nav.items.blog") };
}

/** Artikel Blog (Phase 4e): search, status chips and the list of articles. */
export default async function BlogAdminPage({ searchParams }: PageProps<"/admin/blog">) {
  const [tNav, t] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "Admin.nav.items" }),
    getTranslations({ locale: adminLocale, namespace: "AdminBlog" }),
  ]);
  return (
    <>
      <AdminPageHeader
        breadcrumbs={[]}
        title={tNav("blog")}
        description={t("description")}
        actions={
          <Suspense fallback={null}>
            <WriteButton />
          </Suspense>
        }
      />
      <Suspense fallback={<Skeleton aria-hidden className="h-[32rem] rounded-2xl" />}>
        <Posts searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function WriteButton() {
  const user = await requirePermission("read", "blog", adminRoutes.blog);
  if (!can(user, "create", "blog")) return null;
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminBlog" });
  return (
    <Button asChild>
      <Link href={adminRoutes.newPost}>
        <PenLineIcon aria-hidden />
        {t("add")}
      </Link>
    </Button>
  );
}

async function Posts({ searchParams }: { searchParams: PageProps<"/admin/blog">["searchParams"] }) {
  const user = await requirePermission("read", "blog", adminRoutes.blog);
  const filter = readPostFilter(await searchParams);
  const [t, list, categoryLabels] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminBlog" }),
    getAdminPosts(user, filter),
    postCategoryLabels(),
  ]);

  return (
    <section
      aria-label={t("listLabel")}
      className="flex flex-col gap-5 rounded-2xl surface-glass-panel p-4 sm:p-6"
    >
      <PostFilters filter={filter} counts={list.counts} />
      <p className="text-body-sm text-muted-foreground" aria-live="polite">
        {t("count", { count: list.total })}
      </p>
      <PostList
        rows={list.rows}
        filtered={filter.query !== "" || filter.status !== null}
        categoryLabels={categoryLabels}
        canDelete={can(user, "delete", "blog")}
        now={new Date()}
      />
      <ListPagination
        page={filter.page}
        pageCount={list.pageCount}
        hrefFor={(page) => postListHref({ ...filter, page })}
        label={t("pagination.label")}
      />
    </section>
  );
}
