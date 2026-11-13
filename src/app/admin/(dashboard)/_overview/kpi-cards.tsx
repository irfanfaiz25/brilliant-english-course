import { getFormatter, getTranslations } from "next-intl/server";

import { AdminIcon } from "@/components/admin/admin-icon";
import type { AdminIcon as AdminIconName } from "@/config/admin-navigation";
import { adminLocale } from "@/config/admin-routes";
import { countPostsByStatus } from "@/features/blog/admin-queries";
import { countRecentLeads } from "@/features/partners/admin-queries";
import { getNetworkStats } from "@/features/units/queries";
import type { SessionUser } from "@/features/users/schema";
import { can } from "@/lib/permissions";

type Kpi = { key: string; icon: AdminIconName; label: string; value: string; hint: string };

/** Headline numbers, each only for roles that may read its source (computed, never typed in). */
export async function KpiCards({ user }: { user: SessionUser }) {
  const [t, format] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "Admin.overview.kpi" }),
    getFormatter({ locale: adminLocale }),
  ]);
  const number = (value: number) => format.number(value);

  const [newLeads, network, posts] = await Promise.all([
    can(user, "read", "leads") ? countRecentLeads(user) : null,
    can(user, "read", "units") ? getNetworkStats() : null,
    can(user, "read", "blog") ? countPostsByStatus(user) : null,
  ]);

  const kpis: Kpi[] = [
    ...(newLeads !== null
      ? [
          {
            key: "leads",
            icon: "leads" as const,
            label: t("newLeads"),
            value: number(newLeads),
            hint: t("newLeadsHint"),
          },
        ]
      : []),
    ...(network
      ? [
          {
            key: "units",
            icon: "units" as const,
            label: t("activeUnits"),
            value: number(network.activeUnits),
            hint: t("activeUnitsHint", { cities: network.cities }),
          },
          {
            key: "students",
            icon: "users" as const,
            label: t("students"),
            value: number(network.students),
            hint: t("studentsHint"),
          },
        ]
      : []),
    ...(posts
      ? [
          {
            key: "posts",
            icon: "blog" as const,
            label: t("posts"),
            value: number(posts.published),
            hint: t("postsHint", { draft: posts.draft }),
          },
        ]
      : []),
  ];
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
            <span className="text-h2 text-foreground tabular-nums">{kpi.value}</span>
            <span className="text-body-sm text-muted-foreground">{kpi.hint}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
