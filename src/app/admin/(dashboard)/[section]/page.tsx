import { ArrowLeftIcon, HammerIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { plannedAdminModules } from "@/config/admin-navigation";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { requirePermission } from "@/features/users/session";

/** Every planned module is known at build time; anything else is a 404. */
export function generateStaticParams() {
  return [...plannedAdminModules.keys()].map((section) => ({ section }));
}

export async function generateMetadata({
  params,
}: PageProps<"/admin/[section]">): Promise<Metadata> {
  const planned = plannedAdminModules.get((await params).section);
  if (!planned) return {};
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return { title: t(`nav.items.${planned.key}`) };
}

/**
 * Placeholder for admin modules that land in Phase 4 (one per sidebar item). It already enforces
 * the module's permission, so links and guards can be tested before the module exists; each
 * module replaces it with its own route folder.
 */
export default async function PlannedModulePage({ params }: PageProps<"/admin/[section]">) {
  const { section } = await params;
  const planned = plannedAdminModules.get(section);
  if (!planned) notFound();
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });

  return (
    <>
      <AdminPageHeader
        breadcrumbs={[]}
        title={t(`nav.items.${planned.key}`)}
        description={t("module.description")}
      />
      <Suspense fallback={<Skeleton className="h-56 rounded-2xl" />}>
        <ModuleGate section={section} />
      </Suspense>
    </>
  );
}

async function ModuleGate({ section }: { section: string }) {
  const planned = plannedAdminModules.get(section);
  if (!planned) notFound();
  // Unauthorized roles get the same 404 as an unknown page (ADR-025).
  await requirePermission("read", planned.resource, planned.href);
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });

  return (
    <section className="flex flex-col items-start gap-4 rounded-2xl surface-glass-panel p-6 sm:p-8">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-sunny-100 text-sunny-700">
        <HammerIcon aria-hidden className="size-6" />
      </span>
      <h2 className="text-h4 text-foreground">
        {t("module.title", { phase: planned.phase ?? "" })}
      </h2>
      <p className="max-w-prose text-body text-muted-foreground">{t("module.body")}</p>
      <Button asChild variant="secondary" size="sm">
        <Link href={adminRoutes.home}>
          <ArrowLeftIcon aria-hidden />
          {t("module.back")}
        </Link>
      </Button>
    </section>
  );
}
