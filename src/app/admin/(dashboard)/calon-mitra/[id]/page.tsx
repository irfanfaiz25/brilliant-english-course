import { ExternalLinkIcon, MapPinIcon, StoreIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { BrandIcon } from "@/components/icons/brand-icon";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPanel } from "@/components/admin/admin-panel";
import { BackLink } from "@/components/admin/back-link";
import { DeleteButton } from "@/components/admin/row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { deleteLeadAction } from "@/features/partners/admin-actions";
import {
  getLeadAssignees,
  getLeadDetail,
  getLeadTimeline,
} from "@/features/partners/admin-queries";
import { LeadManageForm } from "@/features/partners/components/lead-manage-form";
import { LeadNoteForm } from "@/features/partners/components/lead-note-form";
import { leadStatusBadge } from "@/features/partners/lead-status";
import { leadStatuses, type LeadStatus } from "@/features/partners/schema";
import { QuotaBadge } from "@/features/quota/components/quota-badge";
import { getVillageQuota } from "@/features/quota/queries";
import { requirePermission } from "@/features/users/session";
import { can } from "@/lib/permissions";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

import { LeadApplicant } from "../_sections/lead-applicant";
import { LeadTimeline } from "../_sections/lead-timeline";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return { title: t("nav.items.leads") };
}

/** One lead (Phase 4d). The id is read inside the boundary: it is request data. */
export default async function LeadPage({ params }: PageProps<"/admin/calon-mitra/[id]">) {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminLeads" });
  return (
    <>
      <BackLink href={adminRoutes.leads} label={t("backToList")} />
      <Suspense fallback={<LeadSkeleton />}>
        <Lead params={params} />
      </Suspense>
    </>
  );
}

async function Lead({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Anything that is not a UUID cannot be a lead (and would fail the query).
  if (!z.uuid().safeParse(id).success) notFound();
  const user = await requirePermission("read", "leads", `${adminRoutes.leads}/${id}`);
  const lead = await getLeadDetail(user, id);
  if (!lead) notFound();

  const [t, tStatus, timeline, assignees, quota] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminLeads" }),
    getTranslations({ locale: adminLocale, namespace: "Admin.leadStatus" }),
    getLeadTimeline(user, id),
    getLeadAssignees(user),
    getVillageQuota(lead.villageCode),
  ]);
  const canEdit = can(user, "update", "leads");
  const statusLabels = Object.fromEntries(
    leadStatuses.map((status) => [status, tStatus(status)]),
  ) as Record<LeadStatus, string>;
  const whatsappUrl = buildWhatsAppUrl(
    lead.whatsapp,
    t("whatsappMessage", { name: lead.fullName, reference: lead.reference }),
  );
  const canCreateUnit =
    !lead.unit &&
    lead.status !== "rejected" &&
    lead.status !== "lost" &&
    can(user, "create", "units");

  return (
    <>
      <AdminPageHeader
        title={lead.fullName}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Badge variant="outline">{lead.reference}</Badge>
            <Badge variant={leadStatusBadge[lead.status]} dot>
              {tStatus(lead.status)}
            </Badge>
          </span>
        }
        actions={
          <>
            <Button asChild variant="whatsapp" size="sm">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <BrandIcon name="whatsapp" className="size-4" />
                {t("chatWhatsApp")}
              </a>
            </Button>
            {can(user, "delete", "leads") && (
              <DeleteButton
                action={deleteLeadAction}
                input={{ id }}
                label={t("delete.label")}
                title={t("delete.title", { name: lead.fullName })}
                description={t("delete.body")}
                confirmLabel={t("delete.confirm")}
                successMessage={t("delete.deleted")}
                redirectTo={adminRoutes.leads}
                showLabel
              />
            )}
          </>
        }
      />

      {/* Rows: the applicant takes its height, the history the rest beside the tall aside. */}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:grid-rows-[auto_1fr]">
        <AdminPanel
          title={t("sections.applicant.title")}
          description={t("sections.applicant.description")}
          className="xl:col-start-1"
        >
          <LeadApplicant lead={lead} />
        </AdminPanel>

        <div className="flex flex-col gap-6 xl:sticky xl:top-24 xl:col-start-2 xl:row-span-2 xl:row-start-1">
          <AdminPanel
            title={t("sections.manage.title")}
            description={t("sections.manage.description")}
          >
            <LeadManageForm
              key={`${lead.status}-${lead.assignedToId ?? ""}`}
              defaultValues={{
                id,
                status: lead.status,
                assignedToId: lead.assignedToId ?? "",
                note: "",
              }}
              statusLabels={statusLabels}
              assignees={assignees}
              canEdit={canEdit}
            />
          </AdminPanel>

          <section className="flex flex-col gap-4 rounded-2xl surface-glass-panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <h2 className="text-label text-foreground">{t("quota")}</h2>
                <p className="flex items-start gap-1.5 text-body-sm text-muted-foreground">
                  <MapPinIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                  {lead.place.village}, {lead.place.regency}
                </p>
              </div>
              <QuotaBadge status={quota.status} />
            </div>
            {lead.reservationId && (
              <p className="rounded-xl bg-partner-soft px-3 py-2 text-body-sm text-foreground">
                {t("slotHeld")}
              </p>
            )}
            <Link
              href={`${adminRoutes.quota}?desa=${encodeURIComponent(lead.villageCode)}#cek-desa`}
              className="inline-flex w-fit items-center gap-1.5 rounded-md text-body-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              {t("viewQuota")}
              <ExternalLinkIcon aria-hidden className="size-4" />
            </Link>

            {lead.unit ? (
              <div className="flex flex-col gap-1 border-t border-border/60 pt-4">
                <h2 className="text-label text-foreground">{t("unit")}</h2>
                <Link
                  href={`${adminRoutes.units}/${lead.unit.id}`}
                  className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  <StoreIcon aria-hidden className="size-4" />
                  {lead.unit.name} · {t("viewUnit", { code: lead.unit.code })}
                </Link>
              </div>
            ) : (
              canCreateUnit && (
                <div className="flex flex-col gap-2 border-t border-border/60 pt-4">
                  <Button asChild variant="secondary" size="sm" className="w-fit">
                    <Link href={`${adminRoutes.newUnit}?lead=${id}`}>
                      <StoreIcon aria-hidden />
                      {t("createUnit")}
                    </Link>
                  </Button>
                  <p className="text-caption text-muted-foreground">{t("createUnitHint")}</p>
                </div>
              )
            )}
          </section>
        </div>

        <AdminPanel
          title={t("sections.history.title")}
          description={t("sections.history.description")}
          className="xl:col-start-1"
        >
          {canEdit && <LeadNoteForm leadId={id} />}
          <LeadTimeline
            receivedAt={lead.createdAt}
            entries={timeline}
            staffNames={new Map(assignees.map((person) => [person.id, person.name]))}
          />
        </AdminPanel>
      </div>
    </>
  );
}

function LeadSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <Skeleton className="h-12 w-72" />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}
