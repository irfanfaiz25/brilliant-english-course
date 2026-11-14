import { ImageIcon, PencilIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { VisibilitySwitch } from "@/components/admin/row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { setLevelPublishedAction } from "@/features/programs/actions";
import { getAdminLevels, type AdminLevel } from "@/features/programs/admin-queries";
import { levelTheme } from "@/features/programs/level-theme";
import { requirePermission } from "@/features/users/session";
import { can } from "@/lib/permissions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return { title: t("nav.items.programs") };
}

/** Program (Phase 4b): the three fixed levels with their visibility and a link to edit each. */
export default async function ProgramsPage() {
  const [tNav, t] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "Admin.nav.items" }),
    getTranslations({ locale: adminLocale, namespace: "AdminPrograms" }),
  ]);
  return (
    <>
      <AdminPageHeader title={tNav("programs")} description={t("description")} />
      <Suspense fallback={<LevelsSkeleton />}>
        <LevelList />
      </Suspense>
    </>
  );
}

async function LevelList() {
  const user = await requirePermission("read", "programs", adminRoutes.programs);
  const [t, levels] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminPrograms" }),
    getAdminLevels(user, adminLocale),
  ]);
  const permissions = {
    canEdit: can(user, "update", "programs"),
    canPublish: can(user, "publish", "programs"),
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body-sm text-muted-foreground">{t("fixedNote")}</p>
      <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {levels.map((level) => (
          <li key={level.slug}>
            <LevelCard level={level} {...permissions} />
          </li>
        ))}
      </ul>
    </div>
  );
}

async function LevelCard({
  level,
  canEdit,
  canPublish,
}: {
  level: AdminLevel;
  canEdit: boolean;
  canPublish: boolean;
}) {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminPrograms" });
  const tVisibility = await getTranslations({
    locale: adminLocale,
    namespace: "AdminForms.visibility",
  });
  const theme = levelTheme[level.slug];

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl surface-glass-panel">
      <div className="relative aspect-video bg-muted">
        {level.imageSrc ? (
          <Image
            src={level.imageSrc}
            alt=""
            fill
            sizes="(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="flex size-full flex-col items-center justify-center gap-2 text-body-sm text-muted-foreground">
            <ImageIcon aria-hidden className="size-8" />
            {t("noImage")}
          </span>
        )}
        <span aria-hidden className={`absolute inset-x-0 bottom-0 h-1.5 ${theme.bar}`} />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-h4 text-foreground">{level.name}</h2>
            <p className="text-body-sm text-muted-foreground">{level.tagline}</p>
          </div>
          <Badge variant={theme.badge}>{t("ages", { min: level.ageMin, max: level.ageMax })}</Badge>
        </div>
        <p className="text-body-sm text-foreground">
          {t("schedule", {
            sessions: level.sessionsPerWeek,
            students: level.maxStudentsPerClass,
          })}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          {canPublish ? (
            <VisibilitySwitch
              action={setLevelPublishedAction}
              input={{ slug: level.slug }}
              checked={level.isPublished}
              label={t("showLabel", { name: level.name })}
            />
          ) : (
            <Badge variant={level.isPublished ? "success" : "neutral"}>
              {level.isPublished ? tVisibility("published") : tVisibility("hidden")}
            </Badge>
          )}
          {canEdit && (
            <Button asChild variant="secondary" size="sm">
              <Link
                href={`${adminRoutes.programs}/${level.slug}`}
                aria-label={t("editLabel", { name: level.name })}
              >
                <PencilIcon aria-hidden />
                {t("edit")}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function LevelsSkeleton() {
  return (
    <div aria-hidden className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-96 rounded-2xl" />
      ))}
    </div>
  );
}
