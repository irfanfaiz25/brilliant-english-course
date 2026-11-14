import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { activityCardLabels } from "@/features/activities/admin-labels";
import { ActivityForm } from "@/features/activities/components/activity-form";
import type { ActivityFormInput } from "@/features/activities/schema";
import { getMediaOptions } from "@/features/media/admin-queries";
import { requirePermission } from "@/features/users/session";
import { can } from "@/lib/permissions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminActivities" });
  return { title: t("createTitle") };
}

const emptyText = { name: "", summary: "", audience: "", imageAlt: "" };
const emptyActivity: ActivityFormInput = {
  imageId: "",
  isPublished: true,
  texts: { id: emptyText, en: emptyText },
};

/** Add an activity (Phase 4b). */
export default async function NewActivityPage() {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminActivities" });
  return (
    <>
      <AdminPageHeader
        breadcrumbs={["activities"]}
        title={t("createTitle")}
        description={t("createDescription")}
      />
      <Suspense fallback={<Skeleton aria-hidden className="h-[32rem] rounded-2xl" />}>
        <NewActivity />
      </Suspense>
    </>
  );
}

async function NewActivity() {
  const user = await requirePermission("create", "activities", adminRoutes.newActivity);
  const mediaOptions = can(user, "read", "media") ? await getMediaOptions(user) : [];
  return (
    <ActivityForm
      defaultValues={emptyActivity}
      mediaOptions={mediaOptions}
      canPublish={can(user, "publish", "activities")}
      previewLabels={await activityCardLabels()}
    />
  );
}
