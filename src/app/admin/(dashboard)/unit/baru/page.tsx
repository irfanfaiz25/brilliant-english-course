import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BackLink } from "@/components/admin/back-link";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { UnitForm } from "@/features/units/components/unit-form";
import type { UnitFormInput } from "@/features/units/schema";
import { requirePermission } from "@/features/users/session";

import { loadUnitFormData } from "../_sections/unit-form-data";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminUnits" });
  return { title: t("createTitle") };
}

/** A new unit starts as "onboarding": it is not public and does not use a quota slot yet. */
const emptyUnit: UnitFormInput = {
  name: "",
  slug: "",
  status: "onboarding",
  enrollment: "open",
  villageCode: "",
  address: "",
  latitude: Number.NaN,
  longitude: Number.NaN,
  managerName: "",
  whatsapp: "",
  openDays: [1, 2, 3, 4, 5],
  opensAt: "14:00",
  closesAt: "18:00",
  levels: [],
  studentsCount: 0,
  openedAt: "",
};

/** Add a unit (Phase 4c). */
export default async function NewUnitPage() {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminUnits" });
  return (
    <>
      <BackLink href={adminRoutes.units} label={t("backToList")} />
      <AdminPageHeader title={t("createTitle")} description={t("createDescription")} />
      <Suspense fallback={<Skeleton aria-hidden className="h-[40rem] rounded-2xl" />}>
        <NewUnit />
      </Suspense>
    </>
  );
}

async function NewUnit() {
  const user = await requirePermission("create", "units", adminRoutes.newUnit);
  const data = await loadUnitFormData(user, null);
  return <UnitForm code="BEC-XX-0000" defaultValues={emptyUnit} {...data} />;
}
