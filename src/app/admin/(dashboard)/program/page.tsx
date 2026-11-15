import { ImageIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ContentRowActions } from "@/components/admin/content-row-actions";
import { SortableList } from "@/components/admin/sortable-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import {
  deleteLevelAction,
  reorderLevelsAction,
  setLevelPublishedAction,
} from "@/features/programs/actions";
import { getAdminLevels, type AdminLevel } from "@/features/programs/admin-queries";
import { levelTheme } from "@/features/programs/level-theme";
import { requirePermission } from "@/features/users/session";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return { title: t("nav.items.programs") };
}

/**
 * Program (Phase 4b, open-ended since ADR-038): the levels in site order, dragged into place, with
 * visibility, edit and delete (only for levels no unit offers).
 */
export default async function ProgramsPage() {
  const [tNav, t] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "Admin.nav.items" }),
    getTranslations({ locale: adminLocale, namespace: "AdminPrograms" }),
  ]);
  return (
    <>
      <AdminPageHeader
        breadcrumbs={[]}
        title={tNav("programs")}
        description={t("description")}
        actions={
          <Suspense fallback={null}>
            <AddButton />
          </Suspense>
        }
      />
      <Suspense fallback={<Skeleton aria-hidden className="h-[28rem] rounded-2xl" />}>
        <LevelList />
      </Suspense>
    </>
  );
}

async function AddButton() {
  const user = await requirePermission("read", "programs", adminRoutes.programs);
  if (!can(user, "create", "programs")) return null;
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminPrograms" });
  return (
    <Button asChild>
      <Link href={adminRoutes.newProgram}>
        <PlusIcon aria-hidden />
        {t("add")}
      </Link>
    </Button>
  );
}

async function LevelList() {
  const user = await requirePermission("read", "programs", adminRoutes.programs);
  const [t, tVisibility, levels] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminPrograms" }),
    getTranslations({ locale: adminLocale, namespace: "AdminForms.visibility" }),
    getAdminLevels(user, adminLocale),
  ]);
  const canUpdate = can(user, "update", "programs");
  const canPublish = can(user, "publish", "programs");
  const canDelete = can(user, "delete", "programs");

  if (levels.length === 0) {
    return (
      <p className="rounded-2xl surface-glass-panel p-6 text-body text-muted-foreground">
        {t("empty")}
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl surface-glass-panel p-4 sm:p-6">
      <p className="text-body-sm text-muted-foreground">{t("orderHint")}</p>
      <SortableList
        action={reorderLevelsAction}
        canReorder={canUpdate}
        rows={levels.map((level) => ({
          id: level.id,
          label: level.name,
          content: (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <LevelThumb level={level} noImage={t("noImage")} />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-body font-semibold text-foreground">{level.name}</span>
                  <Badge variant={levelTheme[level.theme].badge} className="px-2 py-0.5">
                    {t("ages", { min: level.ageMin, max: level.ageMax })}
                  </Badge>
                  {!level.inAgeFinder && (
                    <Badge variant="outline" className="px-2 py-0.5">
                      {t("outsideFinder")}
                    </Badge>
                  )}
                </div>
                <span className="truncate text-body-sm text-muted-foreground">{level.tagline}</span>
                <span className="text-body-sm text-foreground">
                  {level.classes.length > 0
                    ? t("classList", { names: level.classes.map((item) => item.name).join(" · ") })
                    : t("noClasses")}
                </span>
                <span className="text-caption text-muted-foreground">
                  {t("schedule", {
                    sessions: level.sessionsPerWeek,
                    students: level.maxStudentsPerClass,
                  })}{" "}
                  · {t("unitCount", { count: level.unitCount })}
                </span>
              </div>
              <ContentRowActions
                id={level.id}
                isPublished={level.isPublished}
                editHref={`${adminRoutes.programs}/${level.slug}`}
                actions={{ publish: setLevelPublishedAction, remove: deleteLevelAction }}
                can={{
                  update: canUpdate,
                  publish: canPublish,
                  // A level units still offer cannot be deleted (the service refuses it too).
                  remove: canDelete && level.unitCount === 0,
                }}
                labels={{
                  show: t("showLabel", { name: level.name }),
                  published: tVisibility("published"),
                  hidden: tVisibility("hidden"),
                  edit: t("editLabel", { name: level.name }),
                  remove: t("deleteLabel", { name: level.name }),
                  removeTitle: t("deleteTitle", { name: level.name }),
                  removeBody: t("deleteBody"),
                  removeConfirm: t("deleteConfirm"),
                  removed: t("deleted"),
                }}
              />
            </div>
          ),
        }))}
      />
    </section>
  );
}

/** Level photo with its theme color bar, as on the public card. */
function LevelThumb({ level, noImage }: { level: AdminLevel; noImage: string }) {
  return (
    <div className="relative aspect-[3/2] w-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-24">
      {level.imageSrc ? (
        <Image src={level.imageSrc} alt="" fill sizes="96px" className="object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center text-muted-foreground">
          <ImageIcon aria-hidden className="size-5" />
          <span className="sr-only">{noImage}</span>
        </span>
      )}
      <span
        aria-hidden
        className={cn("absolute inset-x-0 bottom-0 h-1", levelTheme[level.theme].bar)}
      />
    </div>
  );
}
