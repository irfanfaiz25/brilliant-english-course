import type { DateTimeFormatOptions } from "next-intl";
import { getFormatter, getTranslations } from "next-intl/server";

import { AdminPanel } from "@/components/admin/admin-panel";
import { AreaTrendChart, type TrendPoint } from "@/components/admin/charts/area-trend-chart";
import { FilterChips } from "@/components/admin/filter-chips";
import { listHref } from "@/components/admin/list-href";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { getLeadTrend, type LeadTrend } from "@/features/partners/admin-queries";
import { defaultTrendRange, trendRanges, type TrendRange } from "@/features/partners/trend";
import type { SessionUser } from "@/features/users/schema";

const day = (key: string) => new Date(`${key}T00:00:00Z`);

/**
 * "Tren calon mitra": applications received and partners won per day, week or month (ADR-037).
 * The range lives in the URL (`?range=`), so it can be shared and survives a reload.
 */
export async function LeadTrendPanel({ user, range }: { user: SessionUser; range: TrendRange }) {
  const [t, format, trend] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "Admin.overview.trend" }),
    getFormatter({ locale: adminLocale }),
    getLeadTrend(user, range),
  ]);
  // Bucket keys are calendar dates; format them as such (UTC), never shifted by a time zone.
  const date = (key: string, options: DateTimeFormatOptions) =>
    format.dateTime(day(key), { ...options, timeZone: "UTC" });

  const points: TrendPoint[] = trend.keys.map((key, index) => pointFor(key, index, trend));

  function pointFor(key: string, index: number, { unit }: LeadTrend): TrendPoint {
    if (unit === "month") {
      const showYear = index === 0 || key.slice(5, 7) === "01";
      return {
        short: date(key, showYear ? { month: "short", year: "2-digit" } : { month: "short" }),
        full: date(key, { month: "long", year: "numeric" }),
      };
    }
    if (unit === "week") {
      const end = new Date(day(key).getTime() + 6 * 86_400_000).toISOString().slice(0, 10);
      return {
        short: date(key, { day: "numeric", month: "short" }),
        full: t("week", {
          start: date(key, { day: "numeric", month: "short" }),
          end: date(end, { day: "numeric", month: "short", year: "numeric" }),
        }),
      };
    }
    return {
      short: date(key, { day: "numeric", month: "short" }),
      full: date(key, { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
    };
  }

  const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);
  const series = [
    { key: "received", label: t("received"), color: "--color-chart-1", values: trend.received },
    { key: "converted", label: t("converted"), color: "--color-chart-2", values: trend.converted },
  ] as const;

  return (
    <AdminPanel
      title={t("title")}
      description={t("description")}
      actions={
        <FilterChips
          label={t("rangeLabel")}
          scroll={false}
          chips={trendRanges.map((value) => ({
            key: value,
            label: t(`ranges.${value}`),
            href: listHref(adminRoutes.home, { range: value === defaultTrendRange ? null : value }),
            active: value === range,
          }))}
        />
      }
    >
      {/* Legend: line keys in the series colour, names and totals in text colours. */}
      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        {series.map((item) => (
          <li key={item.key} className="flex items-center gap-2 text-body-sm">
            <span
              aria-hidden
              className="h-0.5 w-4 rounded-full"
              style={{ backgroundColor: `var(${item.color})` }}
            />
            <span className="text-foreground">{item.label}</span>
            <span className="text-muted-foreground">{t("total", { count: sum(item.values) })}</span>
          </li>
        ))}
      </ul>
      <AreaTrendChart
        series={series}
        points={points}
        labels={{
          plot: t("plot", { range: t(`ranges.${range}`) }),
          period: t("period"),
          showTable: t("showTable"),
          empty: t("empty"),
        }}
      />
    </AdminPanel>
  );
}
