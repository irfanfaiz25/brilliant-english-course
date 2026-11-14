import { ImageIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OrderedRowActions } from "@/components/admin/ordered-row-actions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import {
  deleteActivityAction,
  moveActivityAction,
  setActivityPublishedAction,
} from "@/features/activities/actions";
import { getAdminActivities } from "@/features/activities/admin-queries";
import { requirePermission } from "@/features/users/session";
import { can } from "@/lib/permissions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return { title: t("nav.items.activities") };
}

/** Kegiatan (Phase 4b): ordered list with visibility, reorder, edit and delete per activity. */
export default async function ActivitiesPage() {
  const [tNav, t] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "Admin.nav.items" }),
    getTranslations({ locale: adminLocale, namespace: "AdminActivities" }),
  ]);
  return (
    <>
      <AdminPageHeader
        breadcrumbs={[]}
        title={tNav("activities")}
        description={t("description")}
        actions={
          <Suspense fallback={null}>
            <AddButton />
          </Suspense>
        }
      />
      <Suspense fallback={<ListSkeleton />}>
        <ActivityList />
      </Suspense>
    </>
  );
}

async function AddButton() {
  const user = await requirePermission("read", "activities", adminRoutes.activities);
  if (!can(user, "create", "activities")) return null;
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminActivities" });
  return (
    <Button asChild>
      <Link href={adminRoutes.newActivity}>
        <PlusIcon aria-hidden />
        {t("add")}
      </Link>
    </Button>
  );
}

async function ActivityList() {
  const user = await requirePermission("read", "activities", adminRoutes.activities);
  const [t, tVisibility, activities] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminActivities" }),
    getTranslations({ locale: adminLocale, namespace: "AdminForms.visibility" }),
    getAdminActivities(user, adminLocale),
  ]);
  const canUpdate = can(user, "update", "activities");
  const canPublish = can(user, "publish", "activities");
  const canDelete = can(user, "delete", "activities");

  if (activities.length === 0) {
    return (
      <p className="rounded-2xl surface-glass-panel p-6 text-body text-muted-foreground">
        {t("empty")}
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl surface-glass-panel p-4 sm:p-6">
      <p className="text-body-sm text-muted-foreground">{t("orderHint")}</p>
      <ol className="flex flex-col divide-y divide-border/60">
        {activities.map((activity, index) => (
          <li
            key={activity.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4 first:pt-0 last:pb-0"
          >
            <div className="relative aspect-[3/2] w-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-24">
              {activity.imageSrc ? (
                <Image src={activity.imageSrc} alt="" fill sizes="96px" className="object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center text-muted-foreground">
                  <ImageIcon aria-hidden className="size-5" />
                  <span className="sr-only">{t("noImage")}</span>
                </span>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-body font-semibold text-foreground">{activity.name}</span>
              <span className="truncate text-body-sm text-muted-foreground">
                {activity.audience}
              </span>
            </div>
            <OrderedRowActions
              id={activity.id}
              isPublished={activity.isPublished}
              index={index}
              total={activities.length}
              editHref={`${adminRoutes.activities}/${activity.id}`}
              actions={{
                publish: setActivityPublishedAction,
                move: moveActivityAction,
                remove: deleteActivityAction,
              }}
              can={{ update: canUpdate, publish: canPublish, remove: canDelete }}
              labels={{
                show: t("showLabel", { name: activity.name }),
                published: tVisibility("published"),
                hidden: tVisibility("hidden"),
                moveUp: t("moveUp", { name: activity.name }),
                moveDown: t("moveDown", { name: activity.name }),
                edit: t("editLabel", { name: activity.name }),
                remove: t("deleteLabel", { name: activity.name }),
                removeTitle: t("deleteTitle", { name: activity.name }),
                removeBody: t("deleteBody"),
                removeConfirm: t("deleteConfirm"),
                removed: t("deleted"),
              }}
            />
          </li>
        ))}
      </ol>
    </section>
  );
}

function ListSkeleton() {
  return <Skeleton aria-hidden className="h-[28rem] rounded-2xl" />;
}
