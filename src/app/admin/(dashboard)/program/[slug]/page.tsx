import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LastSaved } from "@/components/admin/last-saved";
import { DeleteButton } from "@/components/admin/row-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { getMediaOptions } from "@/features/media/admin-queries";
import { deleteLevelAction } from "@/features/programs/actions";
import { levelCardLabels } from "@/features/programs/admin-labels";
import { getLevelForEdit } from "@/features/programs/admin-queries";
import { LevelForm } from "@/features/programs/components/level-form";
import { levelSlugSchema } from "@/features/programs/schema";
import { requirePermission } from "@/features/users/session";
import { can } from "@/lib/permissions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return { title: t("nav.items.programs") };
}

/**
 * Edit one program level (Phase 4b; deletable since ADR-038). Levels are added in admin, so the
 * slug is request data and is read inside the boundary.
 */
export default function EditLevelPage({ params }: PageProps<"/admin/program/[slug]">) {
  return (
    <Suspense fallback={<EditSkeleton />}>
      <EditLevel params={params} />
    </Suspense>
  );
}

async function EditLevel({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Anything that is not a slug cannot be a level (and is not worth a query).
  if (!levelSlugSchema.safeParse(slug).success) notFound();
  const path = `${adminRoutes.programs}/${slug}`;
  const user = await requirePermission("update", "programs", path);
  const [t, level, mediaOptions, previewLabels] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminPrograms" }),
    getLevelForEdit(user, slug),
    can(user, "read", "media") ? getMediaOptions(user) : [],
    levelCardLabels(),
  ]);
  if (!level) notFound();
  const name = level.values.texts.id.name || slug;

  return (
    <>
      <AdminPageHeader
        breadcrumbs={["programs"]}
        title={t("editTitle", { name })}
        crumb={name}
        description={
          <>
            {t("editDescription")}{" "}
            <span className="text-caption">
              <LastSaved meta={{ updatedAt: level.updatedAt, updatedBy: null }} />
            </span>
          </>
        }
        actions={
          // A level units still offer cannot be deleted (the service refuses it too).
          can(user, "delete", "programs") &&
          level.unitCount === 0 && (
            <DeleteButton
              action={deleteLevelAction}
              input={{ id: level.id }}
              label={t("deleteLabel", { name })}
              title={t("deleteTitle", { name })}
              description={t("deleteBody")}
              confirmLabel={t("deleteConfirm")}
              successMessage={t("deleted")}
              redirectTo={adminRoutes.programs}
              showLabel
            />
          )
        }
      />
      <LevelForm
        id={level.id}
        defaultValues={level.values}
        mediaOptions={mediaOptions}
        canUploadMedia={can(user, "create", "media")}
        canEdit
        canPublish={can(user, "publish", "programs")}
        previewLabels={previewLabels}
        classesInUse={level.classesInUse}
      />
    </>
  );
}

function EditSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <Skeleton className="h-12 w-72" />
      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
      <Skeleton className="h-[36rem] rounded-2xl" />
    </div>
  );
}
