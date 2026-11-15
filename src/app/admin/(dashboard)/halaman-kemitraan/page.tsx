import { ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPanel } from "@/components/admin/admin-panel";
import { LastSaved } from "@/components/admin/last-saved";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { getMediaOptions } from "@/features/media/admin-queries";
import { getPartnershipPageForEdit } from "@/features/partners/admin-queries";
import { BenefitsForm } from "@/features/partners/components/benefits-form";
import { KitForm } from "@/features/partners/components/kit-form";
import { StepsForm } from "@/features/partners/components/steps-form";
import { TrainingForm } from "@/features/partners/components/training-form";
import { getSettingMeta } from "@/features/settings/admin-queries";
import { requirePermission } from "@/features/users/session";
import { can } from "@/lib/permissions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return { title: t("nav.items.partnershipPage") };
}

/** In-page sections, in the order the public page shows them. */
const sections = ["benefits", "kit", "training", "steps"] as const;

/**
 * Halaman Kemitraan (ADR-041): the content of the public Kemitraan page, one panel per section,
 * each saving its own setting so a mistake in one never blocks another. Layout stays in code.
 */
export default async function PartnershipPageEditor() {
  const [tNav, t] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "Admin.nav.items" }),
    getTranslations({ locale: adminLocale, namespace: "AdminPartnershipPage" }),
  ]);
  return (
    <>
      <AdminPageHeader
        breadcrumbs={[]}
        title={tNav("partnershipPage")}
        description={t("description")}
        actions={
          <Button asChild variant="secondary" size="sm">
            <a href="/kemitraan" target="_blank" rel="noopener noreferrer">
              {t("viewOnSite")}
              <ExternalLinkIcon aria-hidden />
            </a>
          </Button>
        }
      />
      <nav aria-label={t("jumpLabel")} className="-mt-2 mb-6 flex flex-wrap gap-2">
        {sections.map((section) => (
          <a
            key={section}
            href={`#${section}`}
            className="rounded-full border border-border/70 bg-card px-3.5 py-1.5 text-body-sm font-semibold text-foreground transition-colors duration-(--duration-fast) hover:border-primary/60 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {t(`${section}.title`)}
          </a>
        ))}
      </nav>
      <Suspense fallback={<EditorSkeleton />}>
        <Editor />
      </Suspense>
    </>
  );
}

async function Editor() {
  const user = await requirePermission("read", "settings", adminRoutes.partnershipPage);
  const [t, content, meta, mediaOptions] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminPartnershipPage" }),
    getPartnershipPageForEdit(user),
    getSettingMeta(user, "settings", [
      "partnershipBenefits",
      "partnership",
      "partnershipTraining",
      "partnershipSteps",
    ]),
    can(user, "read", "media") ? getMediaOptions(user) : [],
  ]);
  const canEdit = can(user, "update", "settings");
  const canUploadMedia = can(user, "create", "media");

  return (
    <div className="flex flex-col gap-6">
      <AdminPanel
        id="benefits"
        title={t("benefits.title")}
        description={t("benefits.description")}
        meta={<LastSaved meta={meta.partnershipBenefits} />}
      >
        <BenefitsForm defaultValues={content.benefits} canEdit={canEdit} />
      </AdminPanel>
      <AdminPanel
        id="kit"
        title={t("kit.title")}
        description={t("kit.description")}
        meta={<LastSaved meta={meta.partnership} />}
      >
        <KitForm
          defaultValues={content.kit}
          mediaOptions={mediaOptions}
          canUploadMedia={canUploadMedia}
          canEdit={canEdit}
        />
      </AdminPanel>
      <AdminPanel
        id="training"
        title={t("training.title")}
        description={t("training.description")}
        meta={<LastSaved meta={meta.partnershipTraining} />}
      >
        <TrainingForm
          defaultValues={content.training}
          mediaOptions={mediaOptions}
          canUploadMedia={canUploadMedia}
          canEdit={canEdit}
        />
      </AdminPanel>
      <AdminPanel
        id="steps"
        title={t("steps.title")}
        description={t("steps.description")}
        meta={<LastSaved meta={meta.partnershipSteps} />}
      >
        <StepsForm defaultValues={content.steps} canEdit={canEdit} />
      </AdminPanel>
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <Skeleton className="h-96 rounded-2xl" />
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
