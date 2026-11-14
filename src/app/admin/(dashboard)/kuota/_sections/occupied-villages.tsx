import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { adminLocale, adminRoutes } from "@/config/admin-routes";
import type { VillageQuotaRow } from "@/features/quota/admin-queries";

import { QuotaBadge } from "./quota-badges";

const checkHref = (villageCode: string) =>
  `${adminRoutes.quota}?desa=${encodeURIComponent(villageCode)}#cek-desa`;

/** Villages holding units or reservations: a table from `md`, a list on phones. */
export async function OccupiedVillages({ villages }: { villages: readonly VillageQuotaRow[] }) {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminQuota.occupied" });

  if (villages.length === 0) {
    return (
      <p className="rounded-xl bg-surface px-4 py-8 text-center text-body-sm text-muted-foreground">
        {t("empty")}
      </p>
    );
  }

  const viewLink = (row: VillageQuotaRow) => (
    <Link
      href={checkHref(row.villageCode)}
      aria-label={t("viewLabel", { village: row.village })}
      className="rounded-sm text-body-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {t("view")}
    </Link>
  );

  return (
    <>
      <table className="hidden w-full text-left md:table">
        <thead>
          <tr className="border-b border-border/60 text-caption text-muted-foreground">
            <th scope="col" className="py-3 pr-4 font-semibold">
              {t("columns.village")}
            </th>
            <th scope="col" className="py-3 pr-4 text-right font-semibold">
              {t("columns.active")}
            </th>
            <th scope="col" className="py-3 pr-4 text-right font-semibold">
              {t("columns.reserved")}
            </th>
            <th scope="col" className="py-3 pr-4 text-right font-semibold">
              {t("columns.remaining")}
            </th>
            <th scope="col" className="py-3 pr-4 font-semibold">
              {t("columns.status")}
            </th>
            <th scope="col" className="py-3">
              <span className="sr-only">{t("view")}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {villages.map((row) => (
            <tr key={row.villageCode}>
              <th scope="row" className="py-3 pr-4 text-left font-normal">
                <span className="flex flex-col">
                  <span className="text-body-sm font-semibold text-foreground">{row.village}</span>
                  <span className="text-caption text-muted-foreground">
                    {row.district}, {row.regency}
                  </span>
                </span>
              </th>
              <td className="py-3 pr-4 text-right text-body-sm tabular-nums">{row.activeUnits}</td>
              <td className="py-3 pr-4 text-right text-body-sm tabular-nums">{row.reserved}</td>
              <td className="py-3 pr-4 text-right text-body-sm font-semibold tabular-nums">
                {row.remaining}/{row.max}
              </td>
              <td className="py-3 pr-4">
                <QuotaBadge status={row.status} />
              </td>
              <td className="py-3 text-right">{viewLink(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="flex flex-col divide-y divide-border/60 md:hidden">
        {villages.map((row) => (
          <li key={row.villageCode} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <span className="flex flex-col">
                <span className="text-body-sm font-semibold text-foreground">{row.village}</span>
                <span className="text-caption text-muted-foreground">
                  {row.district}, {row.regency}
                </span>
              </span>
              <QuotaBadge status={row.status} />
            </div>
            <div className="flex items-center justify-between gap-3 text-caption text-muted-foreground">
              <span>
                {t("columns.active")} {row.activeUnits} · {t("columns.reserved")} {row.reserved} ·{" "}
                {t("columns.remaining")} {row.remaining}/{row.max}
              </span>
              {viewLink(row)}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
