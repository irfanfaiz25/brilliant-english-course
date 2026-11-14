import { SearchXIcon, SettingsIcon, UsersIcon } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminLocale, adminRoutes, adminTimeZone } from "@/config/admin-routes";
import type { AdminUserRow } from "@/features/users/admin-queries";

import { roleBadge, statusBadge } from "./user-badges";

type UserListProps = {
  rows: readonly AdminUserRow[];
  /** A search or role filter is applied (changes the empty message). */
  filtered: boolean;
  /** Only super admins open an account (`users` update). */
  canManage: boolean;
  currentUserId: string;
};

/** Accounts of one page: a table from `md`, cards below it (DESIGN.md § 6 lists). */
export async function UserList({ rows, filtered, canManage, currentUserId }: UserListProps) {
  const [t, tRole, format] = await Promise.all([
    getTranslations({ locale: adminLocale, namespace: "AdminUsers" }),
    getTranslations({ locale: adminLocale, namespace: "Admin.role" }),
    getFormatter({ locale: adminLocale }),
  ]);

  if (rows.length === 0) {
    const Icon = filtered ? SearchXIcon : UsersIcon;
    return (
      <p className="flex flex-col items-center gap-3 rounded-xl bg-surface px-4 py-12 text-center text-body text-muted-foreground">
        <Icon aria-hidden className="size-8" />
        {filtered ? t("noResults") : t("empty")}
      </p>
    );
  }

  const lastSignIn = (row: AdminUserRow) =>
    row.lastSignInAt
      ? format.dateTime(row.lastSignInAt, {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: adminTimeZone,
        })
      : t("never");
  const who = (row: AdminUserRow) => (
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className="flex flex-wrap items-center gap-2 text-body font-semibold text-foreground">
        {row.name}
        {row.id === currentUserId && <Badge variant="outline">{t("you")}</Badge>}
      </span>
      <span className="truncate text-body-sm text-muted-foreground">{row.email}</span>
    </span>
  );
  const role = (row: AdminUserRow) => (
    <Badge variant={roleBadge[row.role]}>{tRole(row.role)}</Badge>
  );
  const status = (row: AdminUserRow) => (
    <Badge variant={statusBadge[row.status]} dot>
      {t(`status.${row.status}`)}
    </Badge>
  );
  const unit = (row: AdminUserRow) =>
    row.unit ? (
      <span className="text-body-sm text-foreground">
        {row.unit.name}
        {row.unit.deleted && (
          <span className="block text-caption text-destructive-strong">{t("unitDeleted")}</span>
        )}
      </span>
    ) : (
      <span className="text-body-sm text-muted-foreground">–</span>
    );
  const manage = (row: AdminUserRow) =>
    canManage && (
      <Button asChild variant="ghost" size="icon-sm">
        <Link
          href={`${adminRoutes.users}/${row.id}`}
          aria-label={t("manageLabel", { name: row.name })}
        >
          <SettingsIcon aria-hidden />
        </Link>
      </Button>
    );

  return (
    <>
      <table className="hidden w-full text-left md:table">
        <thead>
          <tr className="border-b border-border/60 text-caption font-semibold text-muted-foreground">
            <th scope="col" className="py-3 pr-4 font-semibold">
              {t("columns.user")}
            </th>
            <th scope="col" className="py-3 pr-4 font-semibold">
              {t("columns.role")}
            </th>
            <th scope="col" className="hidden py-3 pr-4 font-semibold lg:table-cell">
              {t("columns.unit")}
            </th>
            <th scope="col" className="py-3 pr-4 font-semibold">
              {t("columns.status")}
            </th>
            <th scope="col" className="hidden py-3 pr-4 font-semibold xl:table-cell">
              {t("columns.lastSignIn")}
            </th>
            <th scope="col" className="py-3 text-right font-semibold">
              <span className="sr-only">{t("columns.actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((row) => (
            <tr key={row.id} className="align-middle">
              <th scope="row" className="max-w-72 py-3 pr-4 text-left font-normal">
                {who(row)}
              </th>
              <td className="py-3 pr-4">{role(row)}</td>
              <td className="hidden py-3 pr-4 lg:table-cell">{unit(row)}</td>
              <td className="py-3 pr-4">{status(row)}</td>
              <td className="hidden py-3 pr-4 text-body-sm text-muted-foreground xl:table-cell">
                {lastSignIn(row)}
              </td>
              <td className="py-3 text-right">{manage(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="flex flex-col divide-y divide-border/60 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              {who(row)}
              {manage(row)}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {role(row)}
              {status(row)}
            </div>
            {row.unit && unit(row)}
            <p className="text-caption text-muted-foreground">
              {t("columns.lastSignIn")}: {lastSignIn(row)}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
