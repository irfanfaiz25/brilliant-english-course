import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { limits } from "@/config/limits";
import { AuthCard } from "@/features/users/components/auth-card";
import { AuthFormSkeleton } from "@/features/users/components/auth-form-skeleton";
import { ResetPasswordForm } from "@/features/users/components/reset-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Auth" });
  // The token in the URL must never leak to other sites through the Referer header.
  return { title: t("reset.metaTitle"), referrer: "no-referrer" };
}

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/admin/reset-password">) {
  const t = await getTranslations({ locale: adminLocale, namespace: "Auth" });
  return (
    <AuthCard
      area={t("area")}
      title={t("reset.title")}
      description={t("reset.description", { min: limits.auth.passwordMin })}
      backLabel={t("backToSite")}
    >
      <Suspense fallback={<AuthFormSkeleton fields={2} />}>
        <ResetFormFromUrl searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function ResetFormFromUrl({
  searchParams,
}: {
  searchParams: PageProps<"/admin/reset-password">["searchParams"];
}) {
  const { token } = await searchParams;
  if (typeof token === "string" && token.length > 0) return <ResetPasswordForm token={token} />;

  const t = await getTranslations({ locale: adminLocale, namespace: "Auth" });
  return (
    <div className="flex flex-col gap-4">
      <p
        role="alert"
        className="rounded-xl bg-destructive-soft px-4 py-3 text-body-sm text-destructive-strong"
      >
        {t("reset.missingToken")}
      </p>
      <Button asChild variant="secondary" className="w-full">
        <Link href={adminRoutes.forgotPassword}>{t("reset.requestNew")}</Link>
      </Button>
    </div>
  );
}
