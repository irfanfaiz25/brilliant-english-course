import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FilterChips } from "@/components/admin/filter-chips";
import { firstParam, listHref } from "@/components/admin/list-href";
import { ContentRowActions } from "@/components/admin/content-row-actions";
import { SortableList } from "@/components/admin/sortable-list";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import {
  deleteFaqItemAction,
  reorderFaqItemsAction,
  setFaqItemPublishedAction,
} from "@/features/faq/actions";
import { getAdminFaqItems } from "@/features/faq/admin-queries";
import { faqListHref } from "@/features/faq/list-href";
import { faqTopics, type FaqTopic } from "@/features/faq/schema";
import { requirePermission } from "@/features/users/session";
import { can } from "@/lib/permissions";

type SearchParams = PageProps<"/admin/faq">["searchParams"];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return { title: t("nav.items.faq") };
}

/** `?topic=` → a known topic; parents (Beranda) by default. */
async function readTopic(searchParams: SearchParams): Promise<FaqTopic> {
  const value = firstParam((await searchParams).topic);
  return faqTopics.find((topic) => topic === value) ?? "parents";
}

/**
 * FAQ (Phase 4f): one ordered list per topic (parents on Beranda, program on Program, partners
 * on Kemitraan) with visibility, reorder, edit and delete.
 */
export default async function FaqPage({ searchParams }: PageProps<"/admin/faq">) {
  const [tNav, t] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "Admin.nav.items" }),
    getTranslations({ locale: adminLocale, namespace: "AdminFaq" }),
  ]);
  return (
    <>
      <AdminPageHeader
        breadcrumbs={[]}
        title={tNav("faq")}
        description={t("description")}
        actions={
          <Suspense fallback={null}>
            <AddButton searchParams={searchParams} />
          </Suspense>
        }
      />
      <Suspense fallback={<Skeleton aria-hidden className="h-[28rem] rounded-2xl" />}>
        <FaqList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

/** "Add" opens the form for the topic on screen. */
async function AddButton({ searchParams }: { searchParams: SearchParams }) {
  const user = await requirePermission("read", "faq", adminRoutes.faq);
  if (!can(user, "create", "faq")) return null;
  const [t, topic] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminFaq" }),
    readTopic(searchParams),
  ]);
  return (
    <Button asChild>
      <Link href={listHref(adminRoutes.newFaqItem, { topic })}>
        <PlusIcon aria-hidden />
        {t("add")}
      </Link>
    </Button>
  );
}

async function FaqList({ searchParams }: { searchParams: SearchParams }) {
  const user = await requirePermission("read", "faq", adminRoutes.faq);
  const topic = await readTopic(searchParams);
  const [t, tVisibility, list] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminFaq" }),
    getTranslations({ locale: adminLocale, namespace: "AdminForms.visibility" }),
    getAdminFaqItems(user, adminLocale, topic),
  ]);
  const permissions = {
    update: can(user, "update", "faq"),
    publish: can(user, "publish", "faq"),
    remove: can(user, "delete", "faq"),
  };
  const placement = t(`placements.${topic}`);

  return (
    <section
      aria-label={t(`topics.${topic}`)}
      className="flex flex-col gap-5 rounded-2xl surface-glass-panel p-4 sm:p-6"
    >
      <FilterChips
        label={t("filters.label")}
        chips={faqTopics.map((key) => ({
          key,
          label: t(`topics.${key}`),
          count: list.counts[key],
          href: faqListHref(key),
          active: key === topic,
        }))}
      />
      {list.items.length === 0 ? (
        <p className="rounded-xl bg-muted/60 p-6 text-body text-muted-foreground">
          {t("empty", { group: t(`topics.${topic}`).toLowerCase(), placement })}
        </p>
      ) : (
        <>
          <p className="text-body-sm text-muted-foreground">{t("orderHint", { placement })}</p>
          <SortableList
            action={reorderFaqItemsAction}
            canReorder={permissions.update}
            rows={list.items.map((item) => ({
              id: item.id,
              label: item.question,
              content: (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                  <div className="flex min-w-0 flex-1 basis-72 flex-col gap-1">
                    <p className="text-body font-semibold text-foreground">{item.question}</p>
                    <p className="line-clamp-2 text-body-sm text-muted-foreground">{item.answer}</p>
                  </div>
                  <ContentRowActions
                    id={item.id}
                    isPublished={item.isPublished}
                    editHref={`${adminRoutes.faq}/${item.id}`}
                    actions={{
                      publish: setFaqItemPublishedAction,
                      remove: deleteFaqItemAction,
                    }}
                    can={permissions}
                    labels={{
                      show: t("showLabel", { name: item.question }),
                      published: tVisibility("published"),
                      hidden: tVisibility("hidden"),
                      edit: t("editLabel", { name: item.question }),
                      remove: t("deleteLabel", { name: item.question }),
                      removeTitle: t("deleteTitle"),
                      removeBody: t("deleteBody", { name: item.question }),
                      removeConfirm: t("deleteConfirm"),
                      removed: t("deleted"),
                    }}
                  />
                </div>
              ),
            }))}
          />
        </>
      )}
    </section>
  );
}
