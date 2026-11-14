import { ChevronRightIcon, InboxIcon, MapPinIcon, SearchXIcon, UserRoundIcon } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { adminLocale, adminRoutes, adminTimeZone } from "@/config/admin-routes";
import type { PipelineLead } from "@/features/partners/admin-queries";
import { leadStatusBadge } from "@/features/partners/lead-status";

/**
 * One page of leads: a table from `md` (the name opens the lead), stacked cards below it, each
 * card a single link. Received dates are relative ("2 hari lalu") with the exact date on hover.
 */
export async function LeadList({
  leads,
  filtered,
}: {
  leads: readonly PipelineLead[];
  filtered: boolean;
}) {
  const [t, tStatus, tForm, format] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminLeads" }),
    getTranslations({ locale: adminLocale, namespace: "Admin.leadStatus" }),
    getTranslations({ locale: adminLocale, namespace: "PartnerForm" }),
    getFormatter({ locale: adminLocale }),
  ]);

  if (leads.length === 0) {
    const Icon = filtered ? SearchXIcon : InboxIcon;
    return (
      <p className="flex flex-col items-center gap-3 rounded-xl bg-surface px-4 py-12 text-center text-body text-muted-foreground">
        <Icon aria-hidden className="size-8" />
        {filtered ? t("noResults") : t("empty")}
      </p>
    );
  }

  const now = new Date();
  const received = (lead: PipelineLead) => (
    <time
      dateTime={lead.createdAt.toISOString()}
      title={format.dateTime(lead.createdAt, {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: adminTimeZone,
      })}
    >
      {format.relativeTime(lead.createdAt, now)}
    </time>
  );
  const status = (lead: PipelineLead) => (
    <Badge variant={leadStatusBadge[lead.status]} dot>
      {tStatus(lead.status)}
    </Badge>
  );
  const href = (lead: PipelineLead) => `${adminRoutes.leads}/${lead.id}`;

  return (
    <>
      <table className="hidden w-full text-left md:table">
        <thead>
          <tr className="border-b border-border/60 text-caption text-muted-foreground">
            <th scope="col" className="py-3 pr-4 font-semibold">
              {t("columns.lead")}
            </th>
            <th scope="col" className="py-3 pr-4 font-semibold">
              {t("columns.village")}
            </th>
            <th scope="col" className="hidden py-3 pr-4 font-semibold xl:table-cell">
              {t("columns.background")}
            </th>
            <th scope="col" className="py-3 pr-4 font-semibold">
              {t("columns.status")}
            </th>
            <th scope="col" className="hidden py-3 pr-4 font-semibold lg:table-cell">
              {t("columns.assignee")}
            </th>
            <th scope="col" className="py-3 text-right font-semibold">
              {t("columns.received")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {leads.map((lead) => (
            <tr
              key={lead.id}
              className="transition-colors duration-(--duration-fast) hover:bg-background/50"
            >
              <th scope="row" className="py-3 pr-4 text-left font-normal">
                <Link
                  href={href(lead)}
                  className="flex flex-col rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <span className="text-body font-semibold text-foreground underline-offset-4 hover:underline">
                    {lead.fullName}
                  </span>
                  <span className="text-caption text-muted-foreground">{lead.reference}</span>
                </Link>
              </th>
              <td className="py-3 pr-4 text-body-sm">
                <span className="flex flex-col">
                  <span className="text-foreground">{lead.village}</span>
                  <span className="text-muted-foreground">{lead.regency}</span>
                </span>
              </td>
              <td className="hidden py-3 pr-4 text-body-sm text-muted-foreground xl:table-cell">
                {tForm(`backgrounds.${lead.background}`)}
              </td>
              <td className="py-3 pr-4">{status(lead)}</td>
              <td className="hidden py-3 pr-4 text-body-sm lg:table-cell">
                {lead.assignee ?? <span className="text-muted-foreground">{t("unassigned")}</span>}
              </td>
              <td className="py-3 text-right text-body-sm whitespace-nowrap text-muted-foreground">
                {received(lead)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="flex flex-col divide-y divide-border/60 md:hidden">
        {leads.map((lead) => (
          <li key={lead.id}>
            <Link
              href={href(lead)}
              className="flex items-center gap-3 rounded-lg py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 flex-col">
                    <span className="text-body font-semibold text-foreground">{lead.fullName}</span>
                    <span className="text-caption text-muted-foreground">{lead.reference}</span>
                  </span>
                  {status(lead)}
                </span>
                <span className="flex items-center gap-1.5 text-body-sm text-muted-foreground">
                  <MapPinIcon aria-hidden className="size-4 shrink-0 text-primary" />
                  {lead.village}, {lead.regency}
                </span>
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <UserRoundIcon aria-hidden className="size-3.5" />
                    {lead.assignee ?? t("unassigned")}
                  </span>
                  {received(lead)}
                </span>
              </span>
              <ChevronRightIcon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
