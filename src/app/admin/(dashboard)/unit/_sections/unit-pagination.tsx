import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { adminLocale } from "@/config/admin-routes";
import type { AdminUnitFilter } from "@/features/units/admin-queries";

import { unitListHref } from "./unit-filters";

/** Previous / next links with "Page x of y"; hidden when everything fits on one page. */
export async function UnitPagination({
  filter,
  pageCount,
}: {
  filter: AdminUnitFilter;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminUnits.pagination" });
  const page = Math.min(filter.page, pageCount);

  return (
    <nav
      aria-label={t("label")}
      className="flex items-center justify-between gap-3 border-t border-border/60 pt-4"
    >
      {page > 1 ? (
        <Button asChild variant="ghost" size="sm">
          <Link href={unitListHref({ ...filter, page: page - 1 })}>
            <ChevronLeftIcon aria-hidden />
            {t("previous")}
          </Link>
        </Button>
      ) : (
        <span />
      )}
      <p className="text-body-sm text-muted-foreground">{t("page", { page, pages: pageCount })}</p>
      {page < pageCount ? (
        <Button asChild variant="ghost" size="sm">
          <Link href={unitListHref({ ...filter, page: page + 1 })}>
            {t("next")}
            <ChevronRightIcon aria-hidden />
          </Link>
        </Button>
      ) : (
        <span />
      )}
    </nav>
  );
}
