import { MapPinIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AdminPanel } from "@/components/admin/admin-panel";
import { adminLocale } from "@/config/admin-routes";
import { getRegionDemand } from "@/features/partners/admin-queries";
import type { SessionUser } from "@/features/users/schema";
import { cn } from "@/lib/utils";

/**
 * "Peluang wilayah": the regencies with the most applications in 12 months beside their active
 * units, so a place with demand and no unit stands out (in words, not colour alone).
 */
export async function RegionDemandPanel({
  user,
  className,
}: {
  user: SessionUser;
  /** Sets the height when it sits beside another panel (the body then scrolls). */
  className?: string;
}) {
  const [t, rows] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "Admin.overview.regions" }),
    getRegionDemand(user),
  ]);
  const max = Math.max(1, ...rows.map((row) => row.leads));

  return (
    <AdminPanel scrollable className={className} title={t("title")} description={t("description")}>
      {rows.length === 0 ? (
        <p className="rounded-xl bg-surface px-4 py-6 text-body-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <ol className="flex flex-col divide-y divide-border/60">
          {rows.map((row) => (
            <li key={row.code} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-body-sm font-semibold text-foreground">
                  <MapPinIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{row.regency}</span>
                </span>
                <span
                  className={cn(
                    "shrink-0 text-caption",
                    row.activeUnits === 0
                      ? "font-semibold text-partner-strong"
                      : "text-muted-foreground",
                  )}
                >
                  {t("units", { count: row.activeUnits })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-2.5 rounded-r-sm bg-chart-1"
                  style={{ width: `${(row.leads / max) * 100}%` }}
                />
                <span className="shrink-0 text-caption text-muted-foreground tabular-nums">
                  {t("leads", { count: row.leads })}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </AdminPanel>
  );
}
