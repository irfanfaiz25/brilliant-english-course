import { MapPinIcon, PencilIcon, SearchXIcon, StoreIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { DeleteButton } from "@/components/admin/row-actions";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { levelTheme } from "@/features/programs/level-theme";
import { deleteUnitAction } from "@/features/units/actions";
import type { AdminUnitRow } from "@/features/units/admin-queries";
import type { EnrollmentStatus } from "@/features/units/schema";
import { unitStatusBadge } from "@/features/units/status-badge";

const enrollmentBadge = {
  open: "success",
  limited: "warning",
  full: "destructive",
} as const satisfies Record<EnrollmentStatus, NonNullable<BadgeProps["variant"]>>;

const levelNames = { kindy: "Kindy", intro: "Intro", secondary: "Secondary" } as const;

type UnitListProps = {
  rows: readonly AdminUnitRow[];
  /** A search or status filter is applied (changes the empty message). */
  filtered: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

/**
 * The units of one page: a table from `md` (scannable columns), cards below it (no sideways
 * scrolling on phones). Both share the same row actions.
 */
export async function UnitList({ rows, filtered, canUpdate, canDelete }: UnitListProps) {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminUnits" });

  if (rows.length === 0) {
    const Icon = filtered ? SearchXIcon : StoreIcon;
    return (
      <p className="flex flex-col items-center gap-3 rounded-xl bg-surface px-4 py-12 text-center text-body text-muted-foreground">
        <Icon aria-hidden className="size-8" />
        {filtered ? t("noResults") : t("empty")}
      </p>
    );
  }

  const actions = (row: AdminUnitRow) => (
    <div className="flex items-center justify-end gap-1">
      {canUpdate && (
        <Button asChild variant="ghost" size="icon-sm">
          <Link
            href={`${adminRoutes.units}/${row.id}`}
            aria-label={t("editLabel", { name: row.name })}
          >
            <PencilIcon aria-hidden />
          </Link>
        </Button>
      )}
      {canDelete && (
        <DeleteButton
          action={deleteUnitAction}
          input={{ id: row.id }}
          label={t("deleteLabel", { name: row.name })}
          title={t("deleteTitle", { name: row.name })}
          description={t("deleteBody")}
          confirmLabel={t("deleteConfirm")}
          successMessage={t("deleted")}
        />
      )}
    </div>
  );
  const status = (row: AdminUnitRow) => (
    <Badge variant={unitStatusBadge[row.status]} dot>
      {t(`status.${row.status}`)}
    </Badge>
  );
  const enrollment = (row: AdminUnitRow) => (
    <Badge variant={enrollmentBadge[row.enrollment]}>{t(`enrollment.${row.enrollment}`)}</Badge>
  );
  const levels = (row: AdminUnitRow) => (
    <span className="flex flex-wrap gap-1">
      {row.levels.map((level) => (
        <Badge key={level} variant={levelTheme[level].badge} className="px-2 py-0.5">
          {levelNames[level]}
        </Badge>
      ))}
    </span>
  );

  return (
    <>
      <table className="hidden w-full text-left md:table">
        <thead>
          <tr className="border-b border-border/60 text-caption font-semibold text-muted-foreground">
            <th scope="col" className="py-3 pr-4 font-semibold">
              {t("columns.unit")}
            </th>
            <th scope="col" className="py-3 pr-4 font-semibold">
              {t("columns.location")}
            </th>
            <th scope="col" className="py-3 pr-4 font-semibold">
              {t("columns.status")}
            </th>
            <th scope="col" className="hidden py-3 pr-4 font-semibold lg:table-cell">
              {t("columns.enrollment")}
            </th>
            <th scope="col" className="py-3 pr-4 text-right font-semibold">
              {t("columns.students")}
            </th>
            <th scope="col" className="py-3 text-right font-semibold">
              <span className="sr-only">{t("columns.actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((row) => (
            <tr key={row.id} className="align-middle">
              <th scope="row" className="py-3 pr-4 text-left font-normal">
                <span className="flex flex-col gap-1">
                  <span className="text-body font-semibold text-foreground">{row.name}</span>
                  <span className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
                    {row.code}
                    {levels(row)}
                  </span>
                </span>
              </th>
              <td className="py-3 pr-4 text-body-sm">
                <span className="flex flex-col">
                  <span className="text-foreground">{row.village}</span>
                  <span className="text-muted-foreground">{row.regency}</span>
                </span>
              </td>
              <td className="py-3 pr-4">{status(row)}</td>
              <td className="hidden py-3 pr-4 lg:table-cell">{enrollment(row)}</td>
              <td className="py-3 pr-4 text-right text-body-sm text-foreground tabular-nums">
                {row.studentsCount}
              </td>
              <td className="py-3">{actions(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="flex flex-col divide-y divide-border/60 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-body font-semibold text-foreground">{row.name}</span>
                <span className="text-caption text-muted-foreground">{row.code}</span>
              </div>
              {status(row)}
            </div>
            <p className="flex items-start gap-2 text-body-sm text-muted-foreground">
              <MapPinIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
              {row.village}, {row.regency}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex flex-wrap items-center gap-2">
                {enrollment(row)}
                <span className="text-caption text-muted-foreground">
                  {t("studentsCount", { count: row.studentsCount })}
                </span>
              </span>
              {actions(row)}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
