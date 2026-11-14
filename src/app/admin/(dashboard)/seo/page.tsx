import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPanel } from "@/components/admin/admin-panel";
import { LastSaved } from "@/components/admin/last-saved";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { getPageOverrides } from "@/features/seo/admin-queries";
import { SeoDefaultsForm } from "@/features/seo/components/seo-defaults-form";
import { getSeoDefaults } from "@/features/seo/queries";
import { getSettingMeta } from "@/features/settings/admin-queries";
import { requirePermission } from "@/features/users/session";
import { routing, type Locale } from "@/i18n/routing";
import { can } from "@/lib/permissions";

import { PageSeoList } from "./_sections/page-seo-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return { title: t("nav.items.seo") };
}

/**
 * SEO (Phase 4a): the site-wide default description and overrides of the static pages (ADR-008).
 * Programs, posts and units get the same editor in their own modules; technical SEO stays in code.
 */
export default async function SeoPage() {
  const [tNav, t] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "Admin.nav.items" }),
    getTranslations({ locale: adminLocale, namespace: "AdminSeo" }),
  ]);
  return (
    <>
      <AdminPageHeader breadcrumbs={[]} title={tNav("seo")} description={t("description")} />
      <Suspense fallback={<SeoSkeleton />}>
        <SeoContent />
      </Suspense>
    </>
  );
}

async function SeoContent() {
  const user = await requirePermission("read", "seo", adminRoutes.seo);
  const [t, overrides, saved, meta, messageDefaults] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminSeo" }),
    getPageOverrides(user),
    getSeoDefaults(),
    getSettingMeta(user, "seo", ["seo"]),
    defaultDescriptions(),
  ]);
  const canEdit = can(user, "update", "seo");
  // Until someone saves the setting, the description shipped in the messages applies.
  const defaults = saved ?? { description: messageDefaults };

  return (
    <div className="flex flex-col gap-6">
      <AdminPanel
        title={t("defaults.title")}
        description={t("defaults.description")}
        meta={<LastSaved meta={meta.seo} />}
      >
        <SeoDefaultsForm defaultValues={defaults} canEdit={canEdit} />
      </AdminPanel>
      <AdminPanel title={t("pages.title")} description={t("pages.description")}>
        <PageSeoList
          overrides={overrides}
          fallbackDescriptions={defaults.description}
          canEdit={canEdit}
          canSetNoindex={can(user, "update", "seoIndexing")}
        />
      </AdminPanel>
    </div>
  );
}

/** The site description from `Metadata.description` in every locale. */
async function defaultDescriptions(): Promise<Record<Locale, string>> {
  const entries = await Promise.all(
    routing.locales.map(async (locale) => {
      const t = await getTranslations({ locale, namespace: "Metadata" });
      return [locale, t("description")] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<Locale, string>;
}

function SeoSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <Skeleton className="h-72 rounded-2xl" />
      <Skeleton className="h-[28rem] rounded-2xl" />
    </div>
  );
}
