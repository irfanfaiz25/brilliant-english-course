import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LastSaved } from "@/components/admin/last-saved";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { getMediaOptions } from "@/features/media/admin-queries";
import { getLevelForEdit } from "@/features/programs/admin-queries";
import { levelCardLabels } from "@/features/programs/admin-labels";
import { LevelForm } from "@/features/programs/components/level-form";
import { levelSlugs, type LevelSlug } from "@/features/programs/schema";
import { requirePermission } from "@/features/users/session";
import { can } from "@/lib/permissions";

/** The three levels are fixed; any other segment is a 404. */
export function generateStaticParams() {
  return levelSlugs.map((slug) => ({ slug }));
}

const isLevelSlug = (slug: string): slug is LevelSlug =>
  (levelSlugs as readonly string[]).includes(slug);

export async function generateMetadata({
  params,
}: PageProps<"/admin/program/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  const name = slug.charAt(0).toUpperCase() + slug.slice(1);
  return { title: `${t("nav.items.programs")} · ${name}` };
}

/** Edit one program level (Phase 4b). */
export default async function EditLevelPage({ params }: PageProps<"/admin/program/[slug]">) {
  const { slug } = await params;
  if (!isLevelSlug(slug)) notFound();
  return (
    <Suspense fallback={<EditSkeleton />}>
      <EditLevel slug={slug} />
    </Suspense>
  );
}

async function EditLevel({ slug }: { slug: LevelSlug }) {
  const path = `${adminRoutes.programs}/${slug}`;
  const user = await requirePermission("update", "programs", path);
  const [t, level, mediaOptions, previewLabels] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminPrograms" }),
    getLevelForEdit(user, slug),
    can(user, "read", "media") ? getMediaOptions(user) : [],
    levelCardLabels(),
  ]);
  if (!level) notFound();

  return (
    <>
      <AdminPageHeader
        breadcrumbs={["programs"]}
        title={t("editTitle", { name: level.values.texts.id.name || slug })}
        crumb={level.values.texts.id.name || slug}
        description={
          <>
            {t("editDescription")}{" "}
            <span className="text-caption">
              <LastSaved meta={{ updatedAt: level.updatedAt, updatedBy: null }} />
            </span>
          </>
        }
      />
      <LevelForm
        defaultValues={level.values}
        mediaOptions={mediaOptions}
        canUploadMedia={can(user, "create", "media")}
        canEdit
        canPublish={can(user, "publish", "programs")}
        previewLabels={previewLabels}
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
