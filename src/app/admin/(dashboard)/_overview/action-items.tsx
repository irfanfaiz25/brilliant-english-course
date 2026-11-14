import { CheckCircle2Icon, ChevronRightIcon } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";

import { AdminIcon } from "@/components/admin/admin-icon";
import { AdminPanel } from "@/components/admin/admin-panel";
import { listHref } from "@/components/admin/list-href";
import type { AdminIcon as AdminIconName } from "@/config/admin-navigation";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { limits } from "@/config/limits";
import { countScheduledPosts } from "@/features/blog/admin-queries";
import { getLeadFollowUps } from "@/features/partners/admin-queries";
import { countAlmostFullVillages } from "@/features/quota/admin-queries";
import { countInvitedUsers } from "@/features/users/admin-queries";
import type { SessionUser } from "@/features/users/schema";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type ActionItem = {
  key: string;
  icon: AdminIconName;
  /** What is waiting, without the number (shown large beside it). */
  label: string;
  href: string;
  count: number;
  /** Overdue or at capacity: marked with the partner accent instead of the neutral tone. */
  urgent?: boolean;
};

/**
 * "Perlu tindakan": what is waiting on staff, each counted only for roles that may act on it and
 * linking to the filtered list. Items with nothing waiting stay out; between none and all five
 * show depending on role and data.
 */
export async function ActionItems({ user }: { user: SessionUser }) {
  const [t, format] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "Admin.overview.actions" }),
    getFormatter({ locale: adminLocale }),
  ]);
  const formatNumber = (value: number) => format.number(value);
  const [followUps, invited, scheduled, almostFull] = await Promise.all([
    can(user, "read", "leads") ? getLeadFollowUps(user) : null,
    can(user, "update", "users") ? countInvitedUsers(user) : 0,
    can(user, "read", "blog") ? countScheduledPosts(user) : 0,
    can(user, "read", "quota") ? countAlmostFullVillages(user) : 0,
  ]);
  const days = limits.overview.staleLeadDays;

  const candidates: ActionItem[] = [
    {
      key: "stale",
      icon: "leads",
      count: followUps?.staleNew ?? 0,
      label: t("staleLeads", { count: followUps?.staleNew ?? 0, days }),
      href: listHref(adminRoutes.leads, { status: "new" }),
      urgent: true,
    },
    {
      key: "mine",
      icon: "leads",
      count: followUps?.mine ?? 0,
      label: t("myLeads", { count: followUps?.mine ?? 0 }),
      href: listHref(adminRoutes.leads, { status: "open", mine: true }),
    },
    {
      key: "invited",
      icon: "users",
      count: invited,
      label: t("invitedUsers", { count: invited }),
      href: adminRoutes.users,
    },
    {
      key: "scheduled",
      icon: "blog",
      count: scheduled,
      label: t("scheduledPosts", { count: scheduled }),
      href: listHref(adminRoutes.blog, { status: "published" }),
    },
    {
      key: "quota",
      icon: "quota",
      count: almostFull,
      label: t("almostFullVillages", { count: almostFull }),
      href: adminRoutes.quota,
      urgent: true,
    },
  ];
  // Urgent items lead; the sort is stable, so each group keeps the order above.
  const items = candidates
    .filter((item) => item.count > 0)
    .sort((a, b) => Number(Boolean(b.urgent)) - Number(Boolean(a.urgent)));

  return (
    <AdminPanel title={t("title")} description={t("description")}>
      {items.length === 0 ? (
        <p className="flex items-center gap-3 rounded-xl bg-success-soft px-4 py-3 text-body-sm text-success-strong">
          <CheckCircle2Icon aria-hidden className="size-5 shrink-0" />
          {t("allClear")}
        </p>
      ) : (
        // auto-fit lets one item span the panel and several share it evenly, so the row never
        // looks half empty whatever the role sees.
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-3">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className={cn(
                  "group flex h-full items-center gap-3 rounded-xl border border-border/70 bg-background/60 py-3 pr-4 pl-3 transition-colors duration-(--duration-fast) hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:gap-4",
                  item.urgent ? "hover:border-partner/60" : "hover:border-primary/60",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-12",
                    item.urgent
                      ? "bg-partner-soft text-partner-strong"
                      : "bg-primary-soft text-primary",
                  )}
                >
                  <AdminIcon name={item.icon} className="size-5" />
                </span>
                <span className="flex min-w-0 flex-1 items-baseline gap-2">
                  <span
                    className={cn(
                      "text-h3 leading-none tabular-nums",
                      item.urgent ? "text-partner-strong" : "text-foreground",
                    )}
                  >
                    {formatNumber(item.count)}
                  </span>
                  <span className="text-body-sm text-muted-foreground">{item.label}</span>
                </span>
                <ChevronRightIcon
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-fast) group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AdminPanel>
  );
}
