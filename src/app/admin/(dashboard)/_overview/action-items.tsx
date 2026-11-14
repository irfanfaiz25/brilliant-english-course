import { CheckCircle2Icon, ChevronRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
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

type ActionItem = { key: string; icon: AdminIconName; text: string; href: string; count: number };

/**
 * "Perlu tindakan": what is waiting on staff, each counted only for roles that may act on it and
 * linking to the filtered list. Items with nothing waiting stay out.
 */
export async function ActionItems({ user }: { user: SessionUser }) {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin.overview.actions" });
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
      text: t("staleLeads", { count: followUps?.staleNew ?? 0, days }),
      href: listHref(adminRoutes.leads, { status: "new" }),
    },
    {
      key: "mine",
      icon: "leads",
      count: followUps?.mine ?? 0,
      text: t("myLeads", { count: followUps?.mine ?? 0 }),
      href: listHref(adminRoutes.leads, { status: "open", mine: true }),
    },
    {
      key: "invited",
      icon: "users",
      count: invited,
      text: t("invitedUsers", { count: invited }),
      href: adminRoutes.users,
    },
    {
      key: "scheduled",
      icon: "blog",
      count: scheduled,
      text: t("scheduledPosts", { count: scheduled }),
      href: listHref(adminRoutes.blog, { status: "published" }),
    },
    {
      key: "quota",
      icon: "quota",
      count: almostFull,
      text: t("almostFullVillages", { count: almostFull }),
      href: adminRoutes.quota,
    },
  ];
  const items = candidates.filter((item) => item.count > 0);

  return (
    <AdminPanel title={t("title")} description={t("description")}>
      {items.length === 0 ? (
        <p className="flex items-center gap-3 rounded-xl bg-success-soft px-4 py-3 text-body-sm text-success-strong">
          <CheckCircle2Icon aria-hidden className="size-5 shrink-0" />
          {t("allClear")}
        </p>
      ) : (
        <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className="group flex min-h-14 items-center gap-3 rounded-xl border border-border/70 bg-background/60 px-4 py-3 transition-colors duration-(--duration-fast) hover:border-primary/60 hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <AdminIcon name={item.icon} className="size-4.5" />
                </span>
                <span className="flex-1 text-body-sm text-foreground">{item.text}</span>
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
