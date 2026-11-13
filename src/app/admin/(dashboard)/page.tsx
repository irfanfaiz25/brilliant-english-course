import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { siteConfig } from "@/config/site";
import { SignOutButton } from "@/features/users/components/sign-out-button";
import { requireUser } from "@/features/users/session";
import { canAccessAdmin } from "@/lib/permissions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return { title: t("metaTitle") };
}

/**
 * Temporary dashboard landing (Phase 3b): proves the session guard end to end. Phase 3c replaces
 * it with the admin shell (sidebar, top bar) and the overview.
 */
export default async function AdminHomePage() {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <Image
        src={siteConfig.logo.src}
        alt={siteConfig.name}
        width={siteConfig.logo.width}
        height={siteConfig.logo.height}
        priority
        sizes="56px"
        className="h-12 w-auto self-start"
      />
      <Suspense
        fallback={
          <Card padding="lg" aria-busy aria-label={t("loading")}>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-full" />
          </Card>
        }
      >
        <Welcome />
      </Suspense>
    </main>
  );
}

async function Welcome() {
  // The guard lives with the data, not in a layout (Next.js auth guide, ADR-025).
  const user = await requireUser(adminRoutes.home);
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  const allowed = canAccessAdmin(user);

  return (
    <Card padding="lg" className="gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-h3 text-foreground">{t("greeting", { name: user.name })}</h1>
        <Badge variant="outline">{t(`role.${user.role}`)}</Badge>
      </div>
      <p className="text-body text-muted-foreground">{allowed ? t("comingSoon") : t("noAccess")}</p>
      <SignOutButton label={t("signOut")} />
    </Card>
  );
}
