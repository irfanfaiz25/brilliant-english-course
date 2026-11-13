import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { adminLocale } from "@/config/admin-routes";
import { AuthCard } from "@/features/users/components/auth-card";
import { AuthFormSkeleton } from "@/features/users/components/auth-form-skeleton";
import { SignInForm } from "@/features/users/components/sign-in-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Auth" });
  return { title: t("metaTitle") };
}

export default async function SignInPage({ searchParams }: PageProps<"/admin/masuk">) {
  const t = await getTranslations({ locale: adminLocale, namespace: "Auth" });
  return (
    <AuthCard
      area={t("area")}
      title={t("signIn.title")}
      description={t("signIn.description")}
      backLabel={t("backToSite")}
    >
      {/* `next` comes from the URL, so only the form waits for the request. */}
      <Suspense fallback={<AuthFormSkeleton fields={2} />}>
        <SignInFormFromUrl searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function SignInFormFromUrl({
  searchParams,
}: {
  searchParams: PageProps<"/admin/masuk">["searchParams"];
}) {
  const { next } = await searchParams;
  return <SignInForm next={typeof next === "string" ? next : null} />;
}
