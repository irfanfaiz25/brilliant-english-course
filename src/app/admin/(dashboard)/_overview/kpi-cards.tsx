import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { AdminIcon } from "@/components/admin/admin-icon";
import type { AdminIcon as AdminIconName } from "@/config/admin-navigation";
import { adminLocale } from "@/config/admin-routes";
import { countPostsByStatus } from "@/features/blog/admin-queries";
import { getLeadKpis } from "@/features/partners/admin-queries";
import { getNetworkStats } from "@/features/units/queries";
import type { SessionUser } from "@/features/users/schema";
import { can } from "@/lib/permissions";

type Kpi = { key: string; icon: AdminIconName; label: string; value: string; hint: ReactNode };

/**
 * Headline numbers, each only for roles that may read its source; all computed from data. Partner
 * leads compare with the 30 days before (an arrow and words, never colour alone).
 */
export async function KpiCards({ user }: { user: SessionUser }) {
  const [t, format] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "Admin.overview.kpi" }),
    getFormatter({ locale: adminLocale }),
  ]);
  const number = (value: number) => format.number(value);
  const readsLeads = can(user, "read", "leads");

  const [leads, network, posts] = await Promise.all([
    readsLeads ? getLeadKpis(user) : null,
    can(user, "read", "units") ? getNetworkStats() : null,
    // Articles only when there is no partnership data to show (editors).
    !readsLeads && can(user, "read", "blog") ? countPostsByStatus(user) : null,
  ]);

  const delta = (current: number, previous: number) => {
    const change = current - previous;
    const Icon = change > 0 ? ArrowUpRightIcon : change < 0 ? ArrowDownRightIcon : MinusIcon;
    const text =
      change > 0
        ? t("deltaUp", { count: change })
        : change < 0
          ? t("deltaDown", { count: -change })
          : t("deltaSame");
    return (
      <span className="flex items-start gap-1">
        <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
        {text}
      </span>
    );
  };

  const kpis: Kpi[] = [];
  if (leads) {
    kpis.push({
      key: "leads",
      icon: "leads",
      label: t("newLeads"),
      value: number(leads.last30),
      hint: (
        <>
          <span>{t("newLeadsHint")}</span>
          {delta(leads.last30, leads.previous30)}
        </>
      ),
    });
    kpis.push({
      key: "conversion",
      icon: "units",
      label: t("conversion"),
      value: leads.year
        ? format.number(leads.yearConverted / leads.year, {
            style: "percent",
            maximumFractionDigits: 0,
          })
        : "–",
      hint: leads.year
        ? t("conversionHint", { converted: leads.yearConverted, total: leads.year })
        : t("conversionEmpty"),
    });
  }
  if (network) {
    kpis.push(
      {
        key: "units",
        icon: "units",
        label: t("activeUnits"),
        value: number(network.activeUnits),
        hint: t("activeUnitsHint", { cities: network.cities }),
      },
      {
        key: "students",
        icon: "users",
        label: t("students"),
        value: number(network.students),
        hint: t("studentsHint"),
      },
    );
  }
  if (posts) {
    kpis.push({
      key: "posts",
      icon: "blog",
      label: t("posts"),
      value: number(posts.published),
      hint: t("postsHint", { draft: posts.draft }),
    });
  }
  if (kpis.length === 0) return null;

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <div key={kpi.key} className="flex flex-col gap-3 rounded-2xl surface-glass-panel p-5">
          <dt className="flex items-center gap-3 text-label text-muted-foreground">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <AdminIcon name={kpi.icon} className="size-5" />
            </span>
            {kpi.label}
          </dt>
          <dd className="flex flex-col gap-1">
            <span className="text-h2 text-foreground">{kpi.value}</span>
            <span className="flex flex-col gap-0.5 text-body-sm text-muted-foreground">
              {kpi.hint}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
