import { ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BackLink } from "@/components/admin/back-link";
import { LastSaved } from "@/components/admin/last-saved";
import { DeleteButton } from "@/components/admin/row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { deleteUnitAction } from "@/features/units/actions";
import { getUnitForEdit } from "@/features/units/admin-queries";
import { UnitForm } from "@/features/units/components/unit-form";
import { unitPathsByCode } from "@/features/units/directory";
import { getUnitDirectory } from "@/features/units/queries";
import { unitStatusBadge } from "@/features/units/status-badge";
import { requirePermission } from "@/features/users/session";
import { can } from "@/lib/permissions";

import { loadUnitFormData } from "../_sections/unit-form-data";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return { title: t("nav.items.units") };
}

/** Edit one unit (Phase 4c). The id is read inside the boundary: it is request data. */
export default async function EditUnitPage({ params }: PageProps<"/admin/unit/[id]">) {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminUnits" });
  return (
    <>
      <BackLink href={adminRoutes.units} label={t("backToList")} />
      <Suspense fallback={<Skeleton aria-hidden className="h-[40rem] rounded-2xl" />}>
        <EditUnit params={params} />
      </Suspense>
    </>
  );
}

async function EditUnit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Anything that is not a UUID cannot be a unit (and would fail the query).
  if (!z.uuid().safeParse(id).success) notFound();
  const user = await requirePermission("update", "units", `${adminRoutes.units}/${id}`);
  const [t, unit, directory] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminUnits" }),
    getUnitForEdit(user, id),
    getUnitDirectory(),
  ]);
  if (!unit) notFound();
  const data = await loadUnitFormData(user, unit.values.villageCode);
  // Only active units have a public page.
  const sitePath = unitPathsByCode(directory)[unit.code];
  const { name, status } = unit.values;

  return (
    <>
      <AdminPageHeader
        title={name}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Badge variant="outline">{unit.code}</Badge>
            <Badge variant={unitStatusBadge[status]} dot>
              {t(`status.${status}`)}
            </Badge>
            <span className="text-caption">
              <LastSaved meta={{ updatedAt: unit.updatedAt, updatedBy: null }} />
            </span>
          </span>
        }
        actions={
          <>
            {sitePath && (
              <Button asChild variant="secondary" size="sm">
                <a href={`/unit/${sitePath.join("/")}`} target="_blank" rel="noopener noreferrer">
                  {t("viewOnSite")}
                  <ExternalLinkIcon aria-hidden />
                </a>
              </Button>
            )}
            {can(user, "delete", "units") && (
              <DeleteButton
                action={deleteUnitAction}
                input={{ id }}
                label={t("deleteLabel", { name })}
                title={t("deleteTitle", { name })}
                description={t("deleteBody")}
                confirmLabel={t("deleteConfirm")}
                successMessage={t("deleted")}
                redirectTo={adminRoutes.units}
                showLabel
              />
            )}
          </>
        }
      />
      <UnitForm id={id} code={unit.code} defaultValues={unit.values} {...data} />
    </>
  );
}
