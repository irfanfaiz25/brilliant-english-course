import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPanel } from "@/components/admin/admin-panel";
import { LastSaved } from "@/components/admin/last-saved";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { getSettingMeta } from "@/features/settings/admin-queries";
import { roleLabels } from "@/features/users/admin-labels";
import { RolePermissionsForm } from "@/features/users/components/role-permissions-form";
import { defaultRoleGrants, getRoleGrants } from "@/features/users/role-permissions";
import type { RolePermissionsInput } from "@/features/users/schema";
import { requirePermission } from "@/features/users/session";
import {
  configurableResources,
  configurableRoles,
  effectiveGrants,
  type RoleGrants,
} from "@/lib/permissions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminUsers.permissions" });
  return { title: t("title") };
}

/** Grants as form values: a mutable list per configurable resource (empty when none). */
function toFormValues(grants: RoleGrants): RolePermissionsInput {
  return Object.fromEntries(
    configurableRoles.map((role) => [
      role,
      Object.fromEntries(
        configurableResources.map((resource) => [resource, [...(grants[role][resource] ?? [])]]),
      ),
    ]),
  ) as RolePermissionsInput;
}

/** Hak akses (ADR-036): super admins tick what Admin and Editor may do. */
export default async function PermissionsPage() {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminUsers.permissions" });
  return (
    <>
      <AdminPageHeader breadcrumbs={["users"]} title={t("title")} description={t("description")} />
      <Suspense fallback={<Skeleton aria-hidden className="h-[36rem] rounded-2xl" />}>
        <Permissions />
      </Suspense>
    </>
  );
}

async function Permissions() {
  const user = await requirePermission("update", "users", adminRoutes.permissions);
  const [t, configured, meta, labels] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminUsers.matrix" }),
    getRoleGrants(),
    getSettingMeta(user, "users", ["rolePermissions"]),
    roleLabels(),
  ]);
  const current: RoleGrants = {
    admin: effectiveGrants("admin", configured),
    editor: effectiveGrants("editor", configured),
  };

  return (
    <AdminPanel title={t("title")} meta={<LastSaved meta={meta.rolePermissions} />}>
      <RolePermissionsForm
        defaultValues={toFormValues(current)}
        defaults={toFormValues(defaultRoleGrants())}
        roleLabels={{ admin: labels.admin, editor: labels.editor }}
      />
    </AdminPanel>
  );
}
