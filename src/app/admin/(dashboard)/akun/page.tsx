import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPanel } from "@/components/admin/admin-panel";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes, adminTimeZone } from "@/config/admin-routes";
import { limits } from "@/config/limits";
import { getOwnAccount } from "@/features/users/admin-queries";
import { AccountProfileForm } from "@/features/users/components/account-profile-form";
import { ChangePasswordForm } from "@/features/users/components/change-password-form";
import { requireUser } from "@/features/users/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminAccount" });
  return { title: t("title") };
}

/** Akun saya (Phase 4g): every signed-in account changes its own name and password here. */
export default async function AccountPage() {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminAccount" });
  return (
    <>
      <AdminPageHeader breadcrumbs={[]} title={t("title")} description={t("description")} />
      <Suspense fallback={<Skeleton aria-hidden className="h-[32rem] rounded-2xl" />}>
        <Account />
      </Suspense>
    </>
  );
}

async function Account() {
  const user = await requireUser(adminRoutes.account);
  const [t, tRole, format, account] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminAccount" }),
    getTranslations({ locale: adminLocale, namespace: "Admin.role" }),
    getFormatter({ locale: adminLocale }),
    getOwnAccount(user),
  ]);
  if (!account) notFound();

  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <AdminPanel
        title={t("sections.profile.title")}
        description={t("sections.profile.description")}
      >
        <dl className="grid gap-4 text-body-sm sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1">
            <dt className="text-muted-foreground">{t("fields.email")}</dt>
            <dd className="truncate text-foreground">{account.email}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">{t("fields.role")}</dt>
            <dd>
              <Badge variant="primary">{tRole(account.role)}</Badge>
            </dd>
          </div>
          {account.unitName && (
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground">{t("fields.unit")}</dt>
              <dd className="text-foreground">{account.unitName}</dd>
            </div>
          )}
          {account.lastSignInAt && (
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground">{t("fields.lastSignIn")}</dt>
              <dd className="text-foreground">
                {format.dateTime(account.lastSignInAt, {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: adminTimeZone,
                })}
              </dd>
            </div>
          )}
        </dl>
        <AccountProfileForm defaultValues={{ name: account.name }} />
      </AdminPanel>
      <AdminPanel
        title={t("sections.password.title")}
        description={t("sections.password.description", { min: limits.auth.passwordMin })}
      >
        <ChangePasswordForm />
      </AdminPanel>
    </div>
  );
}
