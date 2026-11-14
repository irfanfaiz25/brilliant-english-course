import { getTranslations } from "next-intl/server";

import { adminLocale } from "@/config/admin-routes";
import { getLeadsForExport } from "@/features/partners/admin-queries";
import { recordLeadExport } from "@/features/partners/admin-service";
import { getCurrentUser } from "@/features/users/session";
import { toCsv } from "@/lib/csv";
import { can } from "@/lib/permissions";

import { readLeadFilter } from "../_sections/lead-filter";

/**
 * CSV of the leads matching the list's filter (same query string as the list). Staff only:
 * anyone else gets the same 404 as an unknown URL. Each export is written to the audit log.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !can(user, "read", "leads")) return new Response(null, { status: 404 });

  const url = new URL(request.url);
  const filter = readLeadFilter(Object.fromEntries(url.searchParams));
  const [t, tStatus, tForm, leads] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminLeads.csv" }),
    getTranslations({ locale: adminLocale, namespace: "Admin.leadStatus" }),
    getTranslations({ locale: adminLocale, namespace: "PartnerForm" }),
    getLeadsForExport(user, filter),
  ]);

  const received = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Jakarta",
    dateStyle: "short",
    timeStyle: "short",
  });
  const csv = toCsv(
    [
      t("reference"),
      t("name"),
      t("whatsapp"),
      t("email"),
      t("background"),
      t("space"),
      t("motivation"),
      t("village"),
      t("district"),
      t("regency"),
      t("province"),
      t("status"),
      t("assignee"),
      t("received"),
    ],
    leads.map((lead) => [
      lead.reference,
      lead.fullName,
      lead.whatsapp,
      lead.email,
      tForm(`backgrounds.${lead.background}`),
      tForm(`spaces.${lead.space}`),
      lead.motivation,
      lead.village,
      lead.district,
      lead.regency,
      lead.province,
      tStatus(lead.status),
      lead.assignee,
      received.format(lead.createdAt),
    ]),
  );
  await recordLeadExport(user.id, { count: leads.length, filter });

  const today = received.format(new Date()).slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="calon-mitra-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
