import { InboxIcon } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { getLatestLeads } from "@/features/partners/admin-queries";
import { leadStatusBadge } from "@/features/partners/lead-status";
import type { SessionUser } from "@/features/users/schema";
import { can } from "@/lib/permissions";

/** The newest partner applications (read-only until the leads module, Phase 4d). */
export async function LatestLeads({ user }: { user: SessionUser }) {
  if (!can(user, "read", "leads")) return null;
  const [leads, t, format] = await Promise.all([
    getLatestLeads(user),
    getTranslations({ locale: adminLocale, namespace: "Admin" }),
    getFormatter({ locale: adminLocale }),
  ]);

  return (
    <section
      aria-labelledby="latest-leads"
      className="flex flex-col gap-4 rounded-2xl surface-glass-panel p-5 sm:p-6"
    >
      <h2 id="latest-leads" className="text-h4 text-foreground">
        {t("overview.latestLeads")}
      </h2>
      {leads.length === 0 ? (
        <p className="flex items-start gap-3 rounded-xl bg-surface px-4 py-6 text-body-sm text-muted-foreground">
          <InboxIcon aria-hidden className="size-5 shrink-0" />
          {t("overview.latestLeadsEmpty")}
        </p>
      ) : (
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-xl text-left text-body-sm">
            <thead className="text-label text-muted-foreground">
              <tr>
                <th scope="col" className="px-2 py-2 font-medium">
                  {t("overview.leadColumns.name")}
                </th>
                <th scope="col" className="px-2 py-2 font-medium">
                  {t("overview.leadColumns.village")}
                </th>
                <th scope="col" className="px-2 py-2 font-medium">
                  {t("overview.leadColumns.status")}
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  {t("overview.leadColumns.date")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="px-2 py-3">
                    <Link
                      href={`${adminRoutes.leads}/${lead.id}`}
                      className="block rounded-sm font-medium text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {lead.fullName}
                    </Link>
                    <span className="block text-caption text-muted-foreground">
                      {lead.reference}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-foreground">
                    {lead.village}
                    <span className="block text-caption text-muted-foreground">{lead.regency}</span>
                  </td>
                  <td className="px-2 py-3">
                    <Badge variant={leadStatusBadge[lead.status]}>
                      {t(`leadStatus.${lead.status}`)}
                    </Badge>
                  </td>
                  <td className="px-2 py-3 text-right whitespace-nowrap text-muted-foreground">
                    <time dateTime={lead.createdAt.toISOString()}>
                      {format.relativeTime(lead.createdAt, new Date())}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
