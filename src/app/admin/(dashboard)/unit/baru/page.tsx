import { HandshakeIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { z } from "zod";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BackLink } from "@/components/admin/back-link";
import { firstParam } from "@/components/admin/list-href";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { getLeadDetail } from "@/features/partners/admin-queries";
import { unitSlugFromName } from "@/features/units/codes";
import { UnitForm } from "@/features/units/components/unit-form";
import type { UnitFormInput } from "@/features/units/schema";
import { requirePermission } from "@/features/users/session";
import { can } from "@/lib/permissions";

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

/** Add a unit (Phase 4c), optionally from a lead (`?lead=<id>`, Phase 4d). */
export default async function NewUnitPage({ searchParams }: PageProps<"/admin/unit/baru">) {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminUnits" });
  return (
    <>
      <BackLink href={adminRoutes.units} label={t("backToList")} />
      <AdminPageHeader title={t("createTitle")} description={t("createDescription")} />
      <Suspense fallback={<Skeleton aria-hidden className="h-[40rem] rounded-2xl" />}>
        <NewUnit searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function NewUnit({
  searchParams,
}: {
  searchParams: PageProps<"/admin/unit/baru">["searchParams"];
}) {
  const user = await requirePermission("create", "units", adminRoutes.newUnit);
  const leadParam = z.uuid().safeParse(firstParam((await searchParams).lead));
  const lead =
    leadParam.success && can(user, "read", "leads")
      ? await getLeadDetail(user, leadParam.data)
      : null;
  // A lead that already has a unit is not converted twice.
  const source = lead && !lead.unit ? lead : null;
  const values: UnitFormInput = source
    ? {
        ...emptyUnit,
        name: `Unit ${source.place.village}`,
        slug: unitSlugFromName(source.place.village),
        villageCode: source.villageCode,
        // A start for the address: the admin adds the street.
        address: `${source.place.village}, ${source.place.district}, ${source.place.regency}, ${source.place.province}`,
        managerName: source.fullName,
        whatsapp: source.whatsapp,
      }
    : emptyUnit;
  const [t, data] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminLeads" }),
    loadUnitFormData(user, source?.villageCode ?? null),
  ]);

  return (
    <>
      {source && (
        <p className="flex items-start gap-3 rounded-2xl bg-partner-soft px-4 py-3 text-body-sm text-foreground">
          <HandshakeIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-partner" />
          {t("fromLead", { name: source.fullName, reference: source.reference })}
        </p>
      )}
      <UnitForm code="BEC-XX-0000" leadId={source?.id} defaultValues={values} {...data} />
    </>
  );
}
