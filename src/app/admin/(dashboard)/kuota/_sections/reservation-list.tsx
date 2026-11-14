import { CalendarClockIcon, MapPinIcon } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { DeleteButton } from "@/components/admin/row-actions";
import { adminLocale, adminTimeZone } from "@/config/admin-routes";
import type { ReservationRow } from "@/features/quota/admin-queries";
import { releaseReservationAction } from "@/features/quota/actions";

/** Open reservations with where, how many, until when and who made them; release per row. */
export async function ReservationList({
  reservations,
  canRelease,
  compact = false,
}: {
  reservations: readonly ReservationRow[];
  canRelease: boolean;
  /** Inside a village's detail: the place is already known, so it is left out. */
  compact?: boolean;
}) {
  const [t, format] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminQuota.reservations" }),
    getFormatter({ locale: adminLocale }),
  ]);
  const day = (date: Date) =>
    format.dateTime(date, { dateStyle: "medium", timeZone: adminTimeZone });

  return (
    <ul className="flex flex-col divide-y divide-border/60">
      {reservations.map((reservation) => (
        <li key={reservation.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {!compact && (
              <p className="flex items-start gap-1.5 text-body-sm font-semibold text-foreground">
                <MapPinIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  {reservation.village}
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    · {reservation.district}, {reservation.regency}
                  </span>
                </span>
              </p>
            )}
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-foreground">
              <span className="font-semibold">{t("slots", { count: reservation.slots })}</span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <CalendarClockIcon aria-hidden className="size-4" />
                {reservation.expiresAt
                  ? t("until", { date: day(reservation.expiresAt) })
                  : t("untilReleased")}
              </span>
              {reservation.leadReference && (
                <span className="text-muted-foreground">
                  {t("lead", { reference: reservation.leadReference })}
                </span>
              )}
            </p>
            {reservation.note && (
              <p className="text-body-sm text-muted-foreground">{reservation.note}</p>
            )}
            <p className="text-caption text-muted-foreground">
              {reservation.createdBy
                ? t("by", { date: day(reservation.createdAt), name: reservation.createdBy })
                : t("byUnknown", { date: day(reservation.createdAt) })}
            </p>
          </div>
          {canRelease && (
            <DeleteButton
              action={releaseReservationAction}
              input={{ id: reservation.id }}
              label={t("releaseLabel", { village: reservation.village })}
              title={t("releaseTitle", { village: reservation.village })}
              description={t("releaseBody")}
              confirmLabel={t("releaseConfirm")}
              successMessage={t("released")}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
