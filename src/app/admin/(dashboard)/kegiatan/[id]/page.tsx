import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LastSaved } from "@/components/admin/last-saved";
import { DeleteButton } from "@/components/admin/row-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { deleteActivityAction } from "@/features/activities/actions";
import { getActivityForEdit } from "@/features/activities/admin-queries";
import { activityCardLabels } from "@/features/activities/admin-labels";
import { ActivityForm } from "@/features/activities/components/activity-form";
import { getMediaOptions } from "@/features/media/admin-queries";
import { requirePermission } from "@/features/users/session";
import { can } from "@/lib/permissions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return { title: t("nav.items.activities") };
}

/** Edit one activity (Phase 4b). The id is read inside the boundary: it is request data. */
export default function EditActivityPage({ params }: PageProps<"/admin/kegiatan/[id]">) {
  return (
    <Suspense fallback={<EditSkeleton />}>
      <EditActivity params={params} />
    </Suspense>
  );
}

async function EditActivity({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Anything that is not a UUID cannot be an activity (and would fail the query).
  if (!z.uuid().safeParse(id).success) notFound();
  const path = `${adminRoutes.activities}/${id}`;
  const user = await requirePermission("update", "activities", path);
  const [t, activity, mediaOptions, previewLabels] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminActivities" }),
    getActivityForEdit(user, id),
    can(user, "read", "media") ? getMediaOptions(user) : [],
    activityCardLabels(),
  ]);
  if (!activity) notFound();
  const name = activity.values.texts.id.name;

  return (
    <>
      <AdminPageHeader
        breadcrumbs={["activities"]}
        title={t("editTitle", { name })}
        description={
          <>
            {t("editDescription")}{" "}
            <span className="text-caption">
              <LastSaved meta={{ updatedAt: activity.updatedAt, updatedBy: null }} />
            </span>
          </>
        }
        actions={
          can(user, "delete", "activities") && (
            <DeleteButton
              action={deleteActivityAction}
              input={{ id }}
              label={t("deleteLabel", { name })}
              title={t("deleteTitle", { name })}
              description={t("deleteBody")}
              confirmLabel={t("deleteConfirm")}
              successMessage={t("deleted")}
              redirectTo={adminRoutes.activities}
              showLabel
            />
          )
        }
      />
      <ActivityForm
        id={id}
        defaultValues={activity.values}
        mediaOptions={mediaOptions}
        canUploadMedia={can(user, "create", "media")}
        canPublish={can(user, "publish", "activities")}
        previewLabels={previewLabels}
      />
    </>
  );
}

function EditSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <Skeleton className="h-12 w-72" />
      <Skeleton className="h-[32rem] rounded-2xl" />
    </div>
  );
}
