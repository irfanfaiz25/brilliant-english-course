import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { getMediaOptions } from "@/features/media/admin-queries";
import { levelCardLabels } from "@/features/programs/admin-labels";
import { LevelForm } from "@/features/programs/components/level-form";
import type { LevelFormInput } from "@/features/programs/schema";
import { requirePermission } from "@/features/users/session";
import { can } from "@/lib/permissions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminPrograms" });
  return { title: t("createTitle") };
}

const emptyText = {
  name: "",
  tagline: "",
  summary: "",
  skills: [{ value: "" }],
  description: "",
  curriculum: [{ value: "" }],
  imageAlt: "",
};

// Ages stay empty on purpose: the admin types the range; the finder rule then checks it.
const emptyLevel: LevelFormInput = {
  theme: "blue",
  inAgeFinder: true,
  ageMin: Number.NaN,
  ageMax: Number.NaN,
  sessionsPerWeek: 2,
  maxStudentsPerClass: 10,
  imageId: "",
  isPublished: true,
  texts: { id: emptyText, en: emptyText },
};

/** Add a program level (ADR-038). */
export default async function NewLevelPage() {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminPrograms" });
  return (
    <>
      <AdminPageHeader
        breadcrumbs={["programs"]}
        title={t("createTitle")}
        description={t("createDescription")}
      />
      <Suspense fallback={<Skeleton aria-hidden className="h-[40rem] rounded-2xl" />}>
        <NewLevel />
      </Suspense>
    </>
  );
}

async function NewLevel() {
  const user = await requirePermission("create", "programs", adminRoutes.newProgram);
  const [mediaOptions, previewLabels] = await Promise.all([
    can(user, "read", "media") ? getMediaOptions(user) : [],
    levelCardLabels(),
  ]);
  return (
    <LevelForm
      defaultValues={emptyLevel}
      mediaOptions={mediaOptions}
      canUploadMedia={can(user, "create", "media")}
      canEdit
      canPublish={can(user, "publish", "programs")}
      previewLabels={previewLabels}
    />
  );
}
