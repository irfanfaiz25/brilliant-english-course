import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { adminLocale } from "@/config/admin-routes";

type ListPaginationProps = {
  page: number;
  pageCount: number;
  /** URL of another page of the same list (filter kept). */
  hrefFor: (page: number) => string;
  /** Accessible name of the navigation, e.g. "Halaman daftar unit". */
  label: string;
};

/** Previous / next links with "Page x of y"; nothing when everything fits on one page. */
export async function ListPagination({ page, pageCount, hrefFor, label }: ListPaginationProps) {
  if (pageCount <= 1) return null;
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminForms.pagination" });
  const current = Math.min(page, pageCount);

  return (
    <nav
      aria-label={label}
      className="flex items-center justify-between gap-3 border-t border-border/60 pt-4"
    >
      {current > 1 ? (
        <Button asChild variant="ghost" size="sm">
          <Link href={hrefFor(current - 1)}>
            <ChevronLeftIcon aria-hidden />
            {t("previous")}
          </Link>
        </Button>
      ) : (
        <span />
      )}
      <p className="text-body-sm text-muted-foreground">
        {t("page", { page: current, pages: pageCount })}
      </p>
      {current < pageCount ? (
        <Button asChild variant="ghost" size="sm">
          <Link href={hrefFor(current + 1)}>
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
