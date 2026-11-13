import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { adminLocale } from "@/config/admin-routes";
import { AuthCard } from "@/features/users/components/auth-card";
import { ForgotPasswordForm } from "@/features/users/components/forgot-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Auth" });
  return { title: t("forgot.metaTitle") };
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations({ locale: adminLocale, namespace: "Auth" });
  return (
    <AuthCard
      area={t("area")}
      title={t("forgot.title")}
      description={t("forgot.description")}
      backLabel={t("backToSite")}
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
