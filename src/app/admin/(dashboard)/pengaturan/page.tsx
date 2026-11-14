import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPanel } from "@/components/admin/admin-panel";
import { LastSaved } from "@/components/admin/last-saved";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { getPartnershipSetting } from "@/features/partners/queries";
import { getSettingMeta } from "@/features/settings/admin-queries";
import { ContactSettingsForm } from "@/features/settings/components/contact-settings-form";
import { PartnershipSettingsForm } from "@/features/settings/components/partnership-settings-form";
import { toPartnershipFormValues } from "@/features/settings/partnership-form";
import { getContactSettings } from "@/features/settings/queries";
import { requirePermission } from "@/features/users/session";
import { can } from "@/lib/permissions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return { title: t("nav.items.settings") };
}

/**
 * Pengaturan (Phase 4a): site-wide settings that are content, not layout (ADR-008). Each panel
 * saves one `settings` key on its own, so a mistake in one form never blocks the other.
 */
export default async function SettingsPage() {
  const [tNav, t] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "Admin.nav.items" }),
    getTranslations({ locale: adminLocale, namespace: "AdminSettings" }),
  ]);
  return (
    <>
      <AdminPageHeader breadcrumbs={[]} title={tNav("settings")} description={t("description")} />
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </>
  );
}

async function SettingsContent() {
  const user = await requirePermission("read", "settings", adminRoutes.settings);
  const [t, contact, partnership, meta] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminSettings" }),
    getContactSettings(),
    getPartnershipSetting(),
    getSettingMeta(user, "settings", ["contact", "partnership"]),
  ]);
  const canEdit = can(user, "update", "settings");

  return (
    <div className="flex flex-col gap-6">
      <AdminPanel
        title={t("contact.title")}
        description={t("contact.description")}
        meta={<LastSaved meta={meta.contact} />}
      >
        <ContactSettingsForm defaultValues={contact} canEdit={canEdit} />
      </AdminPanel>
      <AdminPanel
        title={t("partnership.title")}
        description={t("partnership.description")}
        meta={<LastSaved meta={meta.partnership} />}
      >
        <PartnershipSettingsForm
          defaultValues={toPartnershipFormValues(partnership)}
          canEdit={canEdit}
        />
      </AdminPanel>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <Skeleton className="h-[32rem] rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}
