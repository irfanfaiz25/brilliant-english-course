import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { AdminPanel } from "@/components/admin/admin-panel";
import { listHref } from "@/components/admin/list-href";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { countLeadsByStatus } from "@/features/partners/admin-queries";
import { isOpenLeadStatus, leadStatuses, type LeadStatus } from "@/features/partners/schema";
import type { SessionUser } from "@/features/users/schema";
import { cn } from "@/lib/utils";

/** Bar colour by meaning: work in progress, partners won (as in the trend), closed without. */
const barClass = (status: LeadStatus) =>
  status === "converted"
    ? "bg-chart-2"
    : isOpenLeadStatus(status)
      ? "bg-chart-1"
      : "bg-neutral-300";

/**
 * "Pipeline calon mitra": live leads per status as horizontal bars (one scale, value at the tip),
 * in progress first, then closed. Each bar opens the list filtered to its status.
 */
export async function LeadPipeline({
  user,
  className,
}: {
  user: SessionUser;
  /** Sets the height when it sits beside another panel (the body then scrolls). */
  className?: string;
}) {
  const [t, tStatus, counts] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "Admin.overview.pipeline" }),
    getTranslations({ locale: adminLocale, namespace: "Admin.leadStatus" }),
    countLeadsByStatus(user),
  ]);
  const max = Math.max(1, ...Object.values(counts));
  const groups = [
    { key: "open", statuses: leadStatuses.filter(isOpenLeadStatus) },
    { key: "closed", statuses: leadStatuses.filter((status) => !isOpenLeadStatus(status)) },
  ] as const;

  return (
    <AdminPanel scrollable className={className} title={t("title")} description={t("description")}>
      <div className="flex flex-col gap-5">
        {groups.map((group) => (
          <div key={group.key} className="flex flex-col gap-2">
            <h3 className="text-caption font-semibold text-muted-foreground uppercase">
              {t(group.key)}
            </h3>
            <ul className="flex flex-col gap-1">
              {group.statuses.map((status) => (
                <li key={status}>
                  <Link
                    href={listHref(adminRoutes.leads, { status })}
                    aria-label={t("bar", { status: tStatus(status), count: counts[status] })}
                    className="group grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-3 rounded-lg px-2 py-1.5 transition-colors duration-(--duration-fast) hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:grid-cols-[9rem_minmax(0,1fr)]"
                  >
                    <span className="truncate text-body-sm text-foreground">{tStatus(status)}</span>
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className={cn(
                          "h-3 rounded-r-sm transition-opacity duration-(--duration-fast) group-hover:opacity-80",
                          barClass(status),
                        )}
                        // A zero keeps a sliver so the row still reads as a bar.
                        style={{ width: `${Math.max(1, (counts[status] / max) * 100)}%` }}
                      />
                      <span
                        aria-hidden
                        className="text-body-sm font-semibold text-foreground tabular-nums"
                      >
                        {counts[status]}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </AdminPanel>
  );
}
