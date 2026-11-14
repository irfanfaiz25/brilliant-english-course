import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { getUnitOptions } from "@/features/units/admin-queries";
import { roleLabels } from "@/features/users/admin-labels";
import { UserForm } from "@/features/users/components/user-form";
import { requirePermission } from "@/features/users/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminUsers" });
  return { title: t("createTitle") };
}

/** Add an account (Phase 4g); it gets an activation link instead of a password. */
export default async function NewUserPage() {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminUsers" });
  return (
    <>
      <AdminPageHeader
        breadcrumbs={["users"]}
        title={t("createTitle")}
        description={t("createDescription")}
      />
      <Suspense fallback={<Skeleton aria-hidden className="h-[28rem] rounded-2xl" />}>
        <NewUser />
      </Suspense>
    </>
  );
}

async function NewUser() {
  const user = await requirePermission("create", "users", adminRoutes.newUser);
  const [unitOptions, labels] = await Promise.all([getUnitOptions(user), roleLabels()]);
  return (
    <UserForm
      defaultValues={{ name: "", email: "", role: "editor", unitId: "" }}
      unitOptions={unitOptions}
      roleLabels={labels}
    />
  );
}
