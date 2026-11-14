import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  ChevronRightIcon,
  GraduationCapIcon,
  HandshakeIcon,
  MinusIcon,
  NewspaperIcon,
  StoreIcon,
  UserPlusIcon,
  type LucideIcon,
} from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import type { ReactNode } from "react";

import { Sparkline } from "@/components/admin/charts/sparkline";
import { listHref } from "@/components/admin/list-href";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { countPostsByStatus } from "@/features/blog/admin-queries";
import { getLeadKpis, getLeadTrend } from "@/features/partners/admin-queries";
import { getNetworkStats } from "@/features/units/queries";
import type { SessionUser } from "@/features/users/schema";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type Kpi = {
  key: string;
  icon: LucideIcon;
  /** Icon chip colours: each card its own brand tint, text tokens on soft fills. */
  tone: string;
  label: string;
  value: string;
  /** Change against the previous period, as a pill beside the value. */
  delta?: ReactNode;
  /** One short line under the value. */
  caption: string;
  /** Small visual at the bottom (sparkline, progress). */
  visual?: ReactNode;
  href: string;
};

/**
 * Headline numbers (Phase 4h, ADR-037), each only for roles that may read its source and each
 * opening its module. One layout for every card (label, value with its change, one line, a
 * small visual at the bottom), so a row of cards lines up whatever the numbers say.
 */
export async function KpiCards({ user }: { user: SessionUser }) {
  const [t, format] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "Admin.overview.kpi" }),
    getFormatter({ locale: adminLocale }),
  ]);
  const number = (value: number) => format.number(value);
  const readsLeads = can(user, "read", "leads");

  const [leads, daily, network, posts] = await Promise.all([
    readsLeads ? getLeadKpis(user) : null,
    readsLeads ? getLeadTrend(user, "30d") : null,
    can(user, "read", "units") ? getNetworkStats() : null,
    // Articles only when there is no partnership data to show (editors).
    !readsLeads && can(user, "read", "blog") ? countPostsByStatus(user) : null,
  ]);

  /** "↑ 51" in green, "↓ 3" in red, "– 0" in grey; the full sentence for hover and AT. */
  const deltaPill = (current: number, previous: number) => {
    const change = current - previous;
    const Icon = change > 0 ? ArrowUpRightIcon : change < 0 ? ArrowDownRightIcon : MinusIcon;
    const sentence =
      change > 0
        ? t("deltaUp", { count: change })
        : change < 0
          ? t("deltaDown", { count: -change })
          : t("deltaSame");
    return (
      <span
        title={sentence}
        className={cn(
          "inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-caption font-semibold",
          change > 0 && "bg-success-soft text-success-strong",
          change < 0 && "bg-destructive-soft text-destructive-strong",
          change === 0 && "bg-muted text-muted-foreground",
        )}
      >
        <Icon aria-hidden className="size-3.5" />
        <span aria-hidden>{number(Math.abs(change))}</span>
        <span className="sr-only">{sentence}</span>
      </span>
    );
  };

  const kpis: Kpi[] = [];
  if (leads) {
    kpis.push({
      key: "leads",
      icon: UserPlusIcon,
      tone: "bg-primary-soft text-primary",
      label: t("newLeads"),
      value: number(leads.last30),
      delta: deltaPill(leads.last30, leads.previous30),
      caption: t("newLeadsHint"),
      visual: daily && <Sparkline values={daily.received} />,
      href: adminRoutes.leads,
    });
    const rate = leads.year ? leads.yearConverted / leads.year : 0;
    kpis.push({
      key: "conversion",
      icon: HandshakeIcon,
      tone: "bg-partner-soft text-partner-strong",
      label: t("conversion"),
      value: leads.year ? format.number(rate, { style: "percent", maximumFractionDigits: 0 }) : "–",
      caption: leads.year
        ? t("conversionHint", { converted: leads.yearConverted, total: leads.year })
        : t("conversionEmpty"),
      visual: (
        <span aria-hidden className="block h-2 overflow-hidden rounded-full bg-partner-soft">
          <span
            className="block h-full rounded-full bg-chart-2"
            style={{ width: `${Math.round(rate * 100)}%` }}
          />
        </span>
      ),
      href: listHref(adminRoutes.leads, { status: "converted" }),
    });
  }
  if (network) {
    kpis.push(
      {
        key: "units",
        icon: StoreIcon,
        tone: "bg-level-kindy-soft text-level-kindy-strong",
        label: t("activeUnits"),
        value: number(network.activeUnits),
        caption: t("activeUnitsHint", { cities: network.cities }),
        href: listHref(adminRoutes.units, { status: "active" }),
      },
      {
        key: "students",
        icon: GraduationCapIcon,
        tone: "bg-info-soft text-info-strong",
        label: t("students"),
        value: number(network.students),
        caption: t("studentsHint"),
        href: adminRoutes.units,
      },
    );
  }
  if (posts) {
    kpis.push({
      key: "posts",
      icon: NewspaperIcon,
      tone: "bg-primary-soft text-primary",
      label: t("posts"),
      value: number(posts.published),
      caption: t("postsHint", { draft: posts.draft }),
      href: adminRoutes.blog,
    });
  }
  if (kpis.length === 0) return null;

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.key}
          className="group relative flex flex-col gap-4 rounded-2xl surface-glass-panel p-5 transition-[box-shadow,translate] duration-(--duration-fast) focus-within:shadow-md hover:shadow-md motion-safe:hover:-translate-y-0.5"
        >
          <dt className="flex items-center gap-3 text-label text-muted-foreground">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                kpi.tone,
              )}
            >
              <kpi.icon aria-hidden className="size-5" />
            </span>
            {/* The whole card is the link target (stretched over the card). */}
            <Link
              href={kpi.href}
              title={t("open", { label: kpi.label })}
              className="flex-1 rounded-sm after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
            >
              {kpi.label}
            </Link>
            <ChevronRightIcon
              aria-hidden
              className="size-4 text-muted-foreground transition-[color,translate] duration-(--duration-fast) group-hover:translate-x-0.5 group-hover:text-primary"
            />
          </dt>
          <dd className="flex flex-1 flex-col gap-1">
            <span className="flex items-center gap-2">
              <span className="text-h2 text-foreground">{kpi.value}</span>
              {kpi.delta}
            </span>
            <span className="truncate text-body-sm text-muted-foreground" title={kpi.caption}>
              {kpi.caption}
            </span>
            {kpi.visual && <span className="mt-auto block pt-3">{kpi.visual}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
