import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPanel } from "@/components/admin/admin-panel";
import { LastSaved } from "@/components/admin/last-saved";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale, adminRoutes, adminTimeZone } from "@/config/admin-routes";
import { getUnitOptions } from "@/features/units/admin-queries";
import { roleLabels } from "@/features/users/admin-labels";
import { getUserForEdit } from "@/features/users/admin-queries";
import { UserAccessActions } from "@/features/users/components/user-access-actions";
import { UserForm } from "@/features/users/components/user-form";
import { accessLinkKind } from "@/features/users/rules";
import { requirePermission } from "@/features/users/session";

import { statusBadge } from "../_sections/user-badges";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return { title: t("nav.items.users") };
}

/** Manage one account (Phase 4g). The id is read inside the boundary: it is request data. */
export default function EditUserPage({ params }: PageProps<"/admin/pengguna/[id]">) {
  return (
    <Suspense fallback={<EditSkeleton />}>
      <EditUser params={params} />
    </Suspense>
  );
}

async function EditUser({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Anything that is not a UUID cannot be an account (and would fail the query).
  if (!z.uuid().safeParse(id).success) notFound();
  const user = await requirePermission("update", "users", `${adminRoutes.users}/${id}`);
  const [t, format, account, unitOptions, labels] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminUsers" }),
    getFormatter({ locale: adminLocale }),
    getUserForEdit(user, id),
    getUnitOptions(user),
    roleLabels(),
  ]);
  if (!account) notFound();
  const isSelf = id === user.id;
  const name = account.values.name;
  const when = (date: Date) =>
    format.dateTime(date, { dateStyle: "medium", timeStyle: "short", timeZone: adminTimeZone });

  return (
    <>
      <AdminPageHeader
        breadcrumbs={["users"]}
        title={name}
        description={
          <>
            {t("editDescription")}{" "}
            <span className="text-caption">
              <LastSaved meta={{ updatedAt: account.updatedAt, updatedBy: null }} />
            </span>
          </>
        }
      />
      <div className="flex flex-col gap-6">
        <AdminPanel
          title={t("sections.access.title")}
          description={t("sections.access.description")}
        >
          <dl className="grid gap-4 text-body-sm sm:grid-cols-2 xl:grid-cols-4">
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground">{t("access.status")}</dt>
              <dd>
                <Badge variant={statusBadge[account.status]} dot>
                  {t(`status.${account.status}`)}
                </Badge>
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground">{t("access.lastSignIn")}</dt>
              <dd className="text-foreground">
                {account.lastSignInAt ? when(account.lastSignInAt) : t("never")}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground">{t("access.created")}</dt>
              <dd className="text-foreground">{when(account.createdAt)}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground">{t("access.devices")}</dt>
              <dd className="text-foreground">
                {t("access.sessions", { count: account.activeSessions })}
              </dd>
            </div>
          </dl>
          <p className="text-body-sm text-muted-foreground">
            {account.status === "disabled"
              ? t("access.disabledHint")
              : account.linkExpiresAt
                ? t("access.pendingLink", {
                    kind: t(`access.kinds.${accessLinkKind(account.hasPassword)}`),
                    date: when(account.linkExpiresAt),
                  })
                : account.status === "invited"
                  ? t("access.invitedHint")
                  : t("access.noPendingLink")}
          </p>
          <UserAccessActions
            id={id}
            name={name}
            status={account.status}
            hasPassword={account.hasPassword}
            hasPendingLink={account.linkExpiresAt !== null}
            isSelf={isSelf}
          />
        </AdminPanel>
        <UserForm
          id={id}
          defaultValues={account.values}
          unitOptions={unitOptions}
          isSelf={isSelf}
          roleLabels={labels}
        />
      </div>
    </>
  );
}

function EditSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <Skeleton className="h-12 w-72" />
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-[28rem] rounded-2xl" />
    </div>
  );
}
