import { getFormatter, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { adminLocale, adminTimeZone } from "@/config/admin-routes";
import type { LeadDetail } from "@/features/partners/admin-queries";

/** What the applicant filled in, as a description list (label above value on phones). */
export async function LeadApplicant({ lead }: { lead: LeadDetail }) {
  const [t, tForm, format] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminLeads.fields" }),
    getTranslations({ locale: adminLocale, namespace: "PartnerForm" }),
    getFormatter({ locale: adminLocale }),
  ]);
  const notFilled = <span className="text-muted-foreground">{t("notFilled")}</span>;
  const phone = `+${lead.whatsapp.slice(0, 2)} ${lead.whatsapp.slice(2)}`;

  const rows: { label: string; value: ReactNode; wide?: boolean }[] = [
    { label: t("reference"), value: lead.reference },
    {
      label: t("whatsapp"),
      value: (
        <a
          href={`tel:+${lead.whatsapp}`}
          className="text-primary underline-offset-4 hover:underline"
        >
          {phone}
        </a>
      ),
    },
    {
      label: t("email"),
      value: lead.email ? (
        <a
          href={`mailto:${lead.email}`}
          className="break-all text-primary underline-offset-4 hover:underline"
        >
          {lead.email}
        </a>
      ) : (
        notFilled
      ),
    },
    { label: t("locale"), value: t(`localeNames.${lead.locale}`) },
    { label: t("background"), value: tForm(`backgrounds.${lead.background}`) },
    { label: t("space"), value: tForm(`spaces.${lead.space}`) },
    {
      label: t("village"),
      value: `${lead.place.village}, ${lead.place.district}, ${lead.place.regency}, ${lead.place.province}`,
      wide: true,
    },
    {
      label: t("motivation"),
      value: lead.motivation ? (
        <span className="whitespace-pre-line">{lead.motivation}</span>
      ) : (
        notFilled
      ),
      wide: true,
    },
  ];

  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {rows.map((row) => (
        <div
          key={row.label}
          className={row.wide ? "flex flex-col gap-1 sm:col-span-2" : "flex flex-col gap-1"}
        >
          <dt className="text-caption font-semibold text-muted-foreground">{row.label}</dt>
          <dd className="text-body-sm text-foreground">{row.value}</dd>
        </div>
      ))}
      <p className="text-caption text-muted-foreground sm:col-span-2">
        <time dateTime={lead.createdAt.toISOString()}>
          {format.dateTime(lead.createdAt, {
            dateStyle: "long",
            timeStyle: "short",
            timeZone: adminTimeZone,
          })}
        </time>
      </p>
    </dl>
  );
}
