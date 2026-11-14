import { ArrowUpRightIcon, ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPanel } from "@/components/admin/admin-panel";
import { DeleteButton } from "@/components/admin/row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes, adminTimeZone } from "@/config/admin-routes";
import { deleteMediaAction } from "@/features/media/actions";
import { getMediaDetail } from "@/features/media/admin-queries";
import { MediaRenameForm } from "@/features/media/components/media-rename-form";
import { formatBytes } from "@/features/media/format";
import { requirePermission } from "@/features/users/session";
import { can } from "@/lib/permissions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return { title: t("nav.items.media") };
}

/** One image: preview, details, its name, where it is used and (when unused) delete. */
export default function MediaDetailPage({ params }: PageProps<"/admin/media/[id]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <MediaDetail params={params} />
    </Suspense>
  );
}

async function MediaDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Anything that is not a UUID cannot be an image (and would fail the query).
  if (!z.uuid().safeParse(id).success) notFound();
  const user = await requirePermission("read", "media", `${adminRoutes.media}/${id}`);
  const [t, format, media] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminMedia" }),
    getFormatter({ locale: adminLocale }),
    getMediaDetail(user, id),
  ]);
  if (!media) notFound();
  const inUse = media.usages.length > 0;

  const facts: { label: string; value: string; wide?: boolean }[] = [
    { label: t("detail.dimensions"), value: `${media.width} × ${media.height} px` },
    {
      label: t("detail.fileSize"),
      value: media.sizeBytes === null ? "—" : formatBytes(media.sizeBytes, adminLocale),
    },
    { label: t("detail.type"), value: media.mimeType.replace("image/", "").toUpperCase() },
    {
      label: t("detail.uploaded"),
      wide: true,
      value: [
        format.dateTime(media.createdAt, {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: adminTimeZone,
        }),
        media.uploadedBy && t("detail.uploadedBy", { name: media.uploadedBy }),
      ]
        .filter(Boolean)
        .join(" "),
    },
  ];

  return (
    <>
      <AdminPageHeader
        breadcrumbs={["media"]}
        title={media.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant={inUse ? "success" : "neutral"}>
              {inUse ? t("usedCount", { count: media.usageCount }) : t("unused")}
            </Badge>
            {media.bundled && <Badge variant="outline">{t("bundled")}</Badge>}
          </span>
        }
        actions={
          <>
            <Button asChild variant="secondary" size="sm">
              <a href={media.src} target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon aria-hidden />
                {t("detail.openOriginal")}
              </a>
            </Button>
            {!inUse && can(user, "delete", "media") && (
              <DeleteButton
                action={deleteMediaAction}
                input={{ id }}
                label={t("delete.label")}
                title={t("delete.title", { name: media.name })}
                description={t("delete.body")}
                confirmLabel={t("delete.confirm")}
                successMessage={t("delete.deleted")}
                redirectTo={adminRoutes.media}
                showLabel
              />
            )}
          </>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <AdminPanel title={t("detail.preview")}>
          <div className="flex justify-center rounded-xl bg-muted p-2 sm:p-4">
            <Image
              src={media.src}
              alt=""
              width={media.width}
              height={media.height}
              sizes="(min-width: 1280px) 720px, 100vw"
              loading="eager"
              className="h-auto max-h-[70vh] w-full rounded-lg object-contain"
            />
          </div>
          {media.bundled && (
            <p className="text-body-sm text-muted-foreground">{t("detail.bundledNote")}</p>
          )}
        </AdminPanel>

        <div className="flex flex-col gap-6">
          <AdminPanel title={t("detail.info")}>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className={fact.wide ? "col-span-2 flex flex-col gap-1" : "flex flex-col gap-1"}
                >
                  <dt className="text-caption font-semibold text-muted-foreground">{fact.label}</dt>
                  <dd className="text-body-sm text-foreground tabular-nums">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </AdminPanel>

          <AdminPanel title={t("detail.renameTitle")} description={t("detail.renameDescription")}>
            <MediaRenameForm
              key={media.name}
              defaultValues={{ id, name: media.name }}
              canEdit={can(user, "update", "media")}
            />
          </AdminPanel>

          <AdminPanel title={t("detail.usagesTitle")} description={t("detail.usagesDescription")}>
            {inUse ? (
              <ul className="flex flex-col divide-y divide-border/60">
                {media.usages.map((usage) => (
                  <li
                    key={`${usage.kind}-${usage.label}`}
                    className="flex items-center gap-3 py-2.5"
                  >
                    <Badge variant="outline">{t(`detail.usageKinds.${usage.kind}`)}</Badge>
                    {usage.href ? (
                      <Link
                        href={usage.href}
                        className="inline-flex min-w-0 items-center gap-1 text-body-sm font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline"
                      >
                        <span className="line-clamp-2">{usage.label}</span>
                        <ArrowUpRightIcon aria-hidden className="size-4 shrink-0" />
                      </Link>
                    ) : (
                      <span className="line-clamp-2 min-w-0 text-body-sm text-foreground">
                        {usage.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl bg-surface px-4 py-3 text-body-sm text-muted-foreground">
                {t("detail.noUsages")}
              </p>
            )}
          </AdminPanel>
        </div>
      </div>
    </>
  );
}

function DetailSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <Skeleton className="h-16 w-72" />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Skeleton className="h-[28rem] rounded-2xl" />
        <Skeleton className="h-[28rem] rounded-2xl" />
      </div>
    </div>
  );
}
