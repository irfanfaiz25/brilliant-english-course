import { PlusIcon, StarIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FilterChips } from "@/components/admin/filter-chips";
import { firstParam, listHref } from "@/components/admin/list-href";
import { OrderedRowActions } from "@/components/admin/ordered-row-actions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import {
  deleteTestimonialAction,
  moveTestimonialAction,
  setTestimonialPublishedAction,
} from "@/features/testimonials/actions";
import { getAdminTestimonials } from "@/features/testimonials/admin-queries";
import { testimonialListHref } from "@/features/testimonials/list-href";
import { testimonialAudiences, type TestimonialAudience } from "@/features/testimonials/schema";
import { requirePermission } from "@/features/users/session";
import { can } from "@/lib/permissions";

type SearchParams = PageProps<"/admin/testimoni">["searchParams"];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return { title: t("nav.items.testimonials") };
}

/** `?audience=` → a known audience; parents (Beranda) by default. */
async function readAudience(searchParams: SearchParams): Promise<TestimonialAudience> {
  const value = firstParam((await searchParams).audience);
  return testimonialAudiences.find((audience) => audience === value) ?? "parent";
}

/**
 * Testimoni (Phase 4f): one ordered list per audience (parents on Beranda, partners on
 * Kemitraan) with visibility, reorder, edit and delete.
 */
export default async function TestimonialsPage({ searchParams }: PageProps<"/admin/testimoni">) {
  const [tNav, t] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "Admin.nav.items" }),
    getTranslations({ locale: adminLocale, namespace: "AdminTestimonials" }),
  ]);
  return (
    <>
      <AdminPageHeader
        breadcrumbs={[]}
        title={tNav("testimonials")}
        description={t("description")}
        actions={
          <Suspense fallback={null}>
            <AddButton searchParams={searchParams} />
          </Suspense>
        }
      />
      <Suspense fallback={<Skeleton aria-hidden className="h-[28rem] rounded-2xl" />}>
        <TestimonialList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

/** "Add" opens the form for the group on screen. */
async function AddButton({ searchParams }: { searchParams: SearchParams }) {
  const user = await requirePermission("read", "testimonials", adminRoutes.testimonials);
  if (!can(user, "create", "testimonials")) return null;
  const [t, audience] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminTestimonials" }),
    readAudience(searchParams),
  ]);
  return (
    <Button asChild>
      <Link href={listHref(adminRoutes.newTestimonial, { audience })}>
        <PlusIcon aria-hidden />
        {t("add")}
      </Link>
    </Button>
  );
}

async function TestimonialList({ searchParams }: { searchParams: SearchParams }) {
  const user = await requirePermission("read", "testimonials", adminRoutes.testimonials);
  const audience = await readAudience(searchParams);
  const [t, tVisibility, list] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminTestimonials" }),
    getTranslations({ locale: adminLocale, namespace: "AdminForms.visibility" }),
    getAdminTestimonials(user, adminLocale, audience),
  ]);
  const permissions = {
    update: can(user, "update", "testimonials"),
    publish: can(user, "publish", "testimonials"),
    remove: can(user, "delete", "testimonials"),
  };
  const placement = t(`placements.${audience}`);

  return (
    <section
      aria-label={t(`audiences.${audience}`)}
      className="flex flex-col gap-5 rounded-2xl surface-glass-panel p-4 sm:p-6"
    >
      <FilterChips
        label={t("filters.label")}
        chips={testimonialAudiences.map((key) => ({
          key,
          label: t(`audiences.${key}`),
          count: list.counts[key],
          href: testimonialListHref(key),
          active: key === audience,
        }))}
      />
      {list.items.length === 0 ? (
        <p className="rounded-xl bg-muted/60 p-6 text-body text-muted-foreground">
          {t("empty", { group: t(`audiences.${audience}`).toLowerCase(), placement })}
        </p>
      ) : (
        <>
          <p className="text-body-sm text-muted-foreground">{t("orderHint", { placement })}</p>
          <ol className="flex flex-col divide-y divide-border/60">
            {list.items.map((item, index) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 flex-1 basis-72 flex-col gap-1">
                  <p className="flex items-center gap-0.5 text-highlight">
                    <span className="sr-only">{t("rating", { rating: item.rating })}</span>
                    {Array.from({ length: item.rating }, (_, star) => (
                      <StarIcon key={star} aria-hidden className="size-3.5 fill-current" />
                    ))}
                  </p>
                  <p className="line-clamp-2 text-body text-foreground">“{item.quote}”</p>
                  <p className="truncate text-body-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{item.authorName}</span>
                    {item.role && ` · ${item.role}`}
                  </p>
                </div>
                <OrderedRowActions
                  id={item.id}
                  isPublished={item.isPublished}
                  index={index}
                  total={list.items.length}
                  editHref={`${adminRoutes.testimonials}/${item.id}`}
                  actions={{
                    publish: setTestimonialPublishedAction,
                    move: moveTestimonialAction,
                    remove: deleteTestimonialAction,
                  }}
                  can={permissions}
                  labels={{
                    show: t("showLabel", { name: item.authorName }),
                    published: tVisibility("published"),
                    hidden: tVisibility("hidden"),
                    moveUp: t("moveUp", { name: item.authorName }),
                    moveDown: t("moveDown", { name: item.authorName }),
                    edit: t("editLabel", { name: item.authorName }),
                    remove: t("deleteLabel", { name: item.authorName }),
                    removeTitle: t("deleteTitle", { name: item.authorName }),
                    removeBody: t("deleteBody"),
                    removeConfirm: t("deleteConfirm"),
                    removed: t("deleted"),
                  }}
                />
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
