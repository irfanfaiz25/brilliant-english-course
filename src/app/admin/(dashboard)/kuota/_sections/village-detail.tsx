import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import type { VillageDetail } from "@/features/quota/admin-queries";
import { QuotaBadge } from "@/features/quota/components/quota-badge";
import { ReservationSheet } from "@/features/quota/components/reservation-sheet";
import type { RegionPickerLevel } from "@/features/regions/picker";
import type { UnitStatus } from "@/features/units/schema";
import { unitStatusBadge } from "@/features/units/status-badge";

import { ReservationList } from "./reservation-list";

/** The checked village: its numbers, the units behind them and its open reservations. */
export async function VillageDetailView({
  detail,
  regionLevels,
  canReserve,
  canRelease,
}: {
  detail: VillageDetail;
  regionLevels: readonly RegionPickerLevel[];
  canReserve: boolean;
  canRelease: boolean;
}) {
  const [t, tUnits] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminQuota.check" }),
    getTranslations({ locale: adminLocale, namespace: "AdminUnits" }),
  ]);
  const { quota, place } = detail;
  const numbers = [
    { label: t("max"), value: quota.max },
    { label: t("active"), value: quota.activeUnits },
    { label: t("reserved"), value: quota.reserved },
    { label: t("remaining"), value: quota.remaining },
  ];

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border/70 bg-background/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col">
          <h3 className="text-h5 text-foreground">{place.village}</h3>
          <p className="text-body-sm text-muted-foreground">
            {place.district}, {place.regency}
          </p>
        </div>
        <QuotaBadge status={quota.status} />
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {numbers.map((item) => (
          <div key={item.label} className="flex flex-col gap-0.5 rounded-lg bg-surface px-3 py-2.5">
            <dt className="text-caption text-muted-foreground">{item.label}</dt>
            <dd className="text-h4 text-foreground tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-2">
        <h4 className="text-label text-foreground">{t("units")}</h4>
        {detail.units.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">{t("noUnits")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {detail.units.map((unit) => (
              <li key={unit.id} className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`${adminRoutes.units}/${unit.id}`}
                  className="rounded-sm text-body-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {unit.name}
                  <span className="ml-2 font-normal text-muted-foreground">{unit.code}</span>
                </Link>
                <Badge variant={unitStatusBadge[unit.status as UnitStatus]} dot>
                  {tUnits(`status.${unit.status as UnitStatus}`)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="text-label text-foreground">{t("reservations")}</h4>
        {detail.reservations.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">{t("noReservations")}</p>
        ) : (
          <ReservationList reservations={detail.reservations} canRelease={canRelease} compact />
        )}
      </div>

      {canReserve && quota.remaining > 0 && (
        <div>
          <ReservationSheet
            regionLevels={regionLevels}
            villageCode={quota.villageCode}
            triggerLabel={t("reserveHere")}
            variant="secondary"
          />
        </div>
      )}
    </div>
  );
}
