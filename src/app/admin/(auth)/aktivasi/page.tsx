import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { adminLocale } from "@/config/admin-routes";
import { limits } from "@/config/limits";
import { AuthCard } from "@/features/users/components/auth-card";
import { AuthFormSkeleton } from "@/features/users/components/auth-form-skeleton";
import { ResetPasswordForm } from "@/features/users/components/reset-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Auth" });
  // The token in the URL must never leak to other sites through the Referer header.
  return { title: t("activate.metaTitle"), referrer: "no-referrer" };
}

/**
 * An invited account sets its first password here (Phase 4g, ADR-035). The link is a reset token
 * created by a super admin, so the reset flow consumes it.
 */
export default async function ActivatePage({ searchParams }: PageProps<"/admin/aktivasi">) {
  const t = await getTranslations({ locale: adminLocale, namespace: "Auth" });
  return (
    <AuthCard
      area={t("area")}
      title={t("activate.title")}
      description={t("activate.description", { min: limits.auth.passwordMin })}
      backLabel={t("backToSite")}
    >
      <Suspense fallback={<AuthFormSkeleton fields={2} />}>
        <ActivateFormFromUrl searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function ActivateFormFromUrl({
  searchParams,
}: {
  searchParams: PageProps<"/admin/aktivasi">["searchParams"];
}) {
  const { token } = await searchParams;
  if (typeof token === "string" && token.length > 0) {
    return <ResetPasswordForm token={token} variant="activate" />;
  }
  const t = await getTranslations({ locale: adminLocale, namespace: "Auth" });
  return (
    <p
      role="alert"
      className="rounded-xl bg-destructive-soft px-4 py-3 text-body-sm text-destructive-strong"
    >
      {t("activate.missingToken")}
    </p>
  );
}
