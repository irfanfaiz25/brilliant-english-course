import { MapPinnedIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPanel } from "@/components/admin/admin-panel";
import { LastSaved } from "@/components/admin/last-saved";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import {
  countRecentlyExpired,
  getOccupiedVillages,
  getOpenReservations,
  getVillageDetail,
} from "@/features/quota/admin-queries";
import { QuotaRulesForm } from "@/features/quota/components/quota-rules-form";
import { ReservationSheet } from "@/features/quota/components/reservation-sheet";
import { VillageCheckPicker } from "@/features/quota/components/village-check-picker";
import { getQuotaRules } from "@/features/quota/queries";
import { getRegionPickerLevels } from "@/features/regions/picker";
import { villageCodeField } from "@/features/regions/schema";
import { getSettingMeta } from "@/features/settings/admin-queries";
import { requirePermission } from "@/features/users/session";
import { can } from "@/lib/permissions";

import { OccupiedVillages } from "./_sections/occupied-villages";
import { ReservationList } from "./_sections/reservation-list";
import { VillageDetailView } from "./_sections/village-detail";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return { title: t("nav.items.quota") };
}

/**
 * Kuota Wilayah (Phase 4c): the rules, a village check (`?desa=`), the occupied villages and the
 * open reservations. Every number is computed from units and reservations (ADR-029).
 */
export default async function QuotaPage({ searchParams }: PageProps<"/admin/kuota">) {
  const [tNav, t] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "Admin.nav.items" }),
    getTranslations({ locale: adminLocale, namespace: "AdminQuota" }),
  ]);
  return (
    <>
      <AdminPageHeader title={tNav("quota")} description={t("description")} />
      <Suspense fallback={<QuotaSkeleton />}>
        <QuotaContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function QuotaContent({
  searchParams,
}: {
  searchParams: PageProps<"/admin/kuota">["searchParams"];
}) {
  const user = await requirePermission("read", "quota", adminRoutes.quota);
  const desa = (await searchParams).desa;
  const parsed = villageCodeField.safeParse(Array.isArray(desa) ? desa[0] : desa);
  const villageCode = parsed.success ? parsed.data : null;
  const rules = await getQuotaRules();

  const [t, occupied, reservations, expired, meta, detail, pickerLevels] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminQuota" }),
    getOccupiedVillages(user, rules),
    getOpenReservations(user),
    countRecentlyExpired(user),
    getSettingMeta(user, "quota", ["quota"]),
    villageCode ? getVillageDetail(user, villageCode, rules) : null,
    getRegionPickerLevels(villageCode),
  ]);
  const canReserve = can(user, "create", "quota");
  const canRelease = can(user, "delete", "quota");

  return (
    <div className="flex flex-col gap-6">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <AdminPanel
          title={t("rules.title")}
          description={t("rules.description")}
          meta={<LastSaved meta={meta.quota} />}
        >
          <QuotaRulesForm defaultValues={rules} canEdit={can(user, "update", "quota")} />
        </AdminPanel>

        <AdminPanel title={t("check.title")} description={t("check.description")}>
          <div id="cek-desa" className="flex scroll-mt-24 flex-col gap-5">
            {/* A new key per village: the picker restarts from the checked village. */}
            <VillageCheckPicker key={villageCode ?? "none"} regionLevels={pickerLevels} />
            {detail ? (
              <VillageDetailView
                detail={detail}
                regionLevels={pickerLevels}
                canReserve={canReserve}
                canRelease={canRelease}
              />
            ) : (
              <p className="flex items-center gap-3 rounded-xl bg-surface px-4 py-6 text-body-sm text-muted-foreground">
                <MapPinnedIcon aria-hidden className="size-5 shrink-0" />
                {t("check.description")}
              </p>
            )}
          </div>
        </AdminPanel>
      </div>

      <AdminPanel title={t("occupied.title")} description={t("occupied.description")}>
        <OccupiedVillages villages={occupied} />
      </AdminPanel>

      <AdminPanel
        title={t("reservations.title")}
        description={t("reservations.description")}
        meta={expired > 0 ? t("reservations.expiredHint", { count: expired }) : undefined}
        actions={
          canReserve && (
            <ReservationSheet
              regionLevels={pickerLevels}
              villageCode={villageCode ?? ""}
              triggerLabel={t("reservations.add")}
            />
          )
        }
      >
        {reservations.length === 0 ? (
          <p className="rounded-xl bg-surface px-4 py-8 text-center text-body-sm text-muted-foreground">
            {t("reservations.empty")}
          </p>
        ) : (
          <ReservationList reservations={reservations} canRelease={canRelease} />
        )}
      </AdminPanel>
    </div>
  );
}

function QuotaSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}
