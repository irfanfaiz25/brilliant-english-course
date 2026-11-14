import { ArrowRightIcon, InboxIcon } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";

import { AdminPanel } from "@/components/admin/admin-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { getLatestLeads, type LeadListItem } from "@/features/partners/admin-queries";
import { leadStatusBadge } from "@/features/partners/lead-status";
import type { SessionUser } from "@/features/users/schema";

/** The newest partner applications: a table from `md`, cards below; each opens its lead. */
export async function LatestLeads({ user }: { user: SessionUser }) {
  const [leads, t, format] = await Promise.all([
    getLatestLeads(user),
    getTranslations({ locale: adminLocale, namespace: "Admin" }),
    getFormatter({ locale: adminLocale }),
  ]);
  const now = new Date();
  const name = (lead: LeadListItem) => (
    <span className="flex min-w-0 flex-col">
      <Link
        href={`${adminRoutes.leads}/${lead.id}`}
        className="truncate rounded-sm font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {lead.fullName}
      </Link>
      <span className="text-caption text-muted-foreground">{lead.reference}</span>
    </span>
  );
  const status = (lead: LeadListItem) => (
    <Badge variant={leadStatusBadge[lead.status]}>{t(`leadStatus.${lead.status}`)}</Badge>
  );
  const received = (lead: LeadListItem) => (
    <time dateTime={lead.createdAt.toISOString()}>{format.relativeTime(lead.createdAt, now)}</time>
  );

  return (
    <AdminPanel
      title={t("overview.latestLeads")}
      actions={
        leads.length > 0 && (
          <Button asChild variant="ghost" size="sm">
            <Link href={adminRoutes.leads}>
              {t("overview.viewAll")}
              <ArrowRightIcon aria-hidden />
            </Link>
          </Button>
        )
      }
    >
      {leads.length === 0 ? (
        <p className="flex items-start gap-3 rounded-xl bg-surface px-4 py-6 text-body-sm text-muted-foreground">
          <InboxIcon aria-hidden className="size-5 shrink-0" />
          {t("overview.latestLeadsEmpty")}
        </p>
      ) : (
        <>
          <table className="hidden w-full text-left text-body-sm md:table">
            <thead>
              <tr className="border-b border-border/60 text-caption font-semibold text-muted-foreground">
                <th scope="col" className="py-2 pr-4 font-semibold">
                  {t("overview.leadColumns.name")}
                </th>
                <th scope="col" className="py-2 pr-4 font-semibold">
                  {t("overview.leadColumns.village")}
                </th>
                <th scope="col" className="py-2 pr-4 font-semibold">
                  {t("overview.leadColumns.status")}
                </th>
                <th scope="col" className="py-2 text-right font-semibold">
                  {t("overview.leadColumns.date")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="max-w-56 py-3 pr-4">{name(lead)}</td>
                  <td className="py-3 pr-4 text-foreground">
                    {lead.village}
                    <span className="block text-caption text-muted-foreground">{lead.regency}</span>
                  </td>
                  <td className="py-3 pr-4">{status(lead)}</td>
                  <td className="py-3 text-right whitespace-nowrap text-muted-foreground">
                    {received(lead)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="flex flex-col divide-y divide-border/60 text-body-sm md:hidden">
            {leads.map((lead) => (
              <li key={lead.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  {name(lead)}
                  {status(lead)}
                </div>
                <p className="text-caption text-muted-foreground">
                  {lead.village}, {lead.regency} · {received(lead)}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </AdminPanel>
  );
}
