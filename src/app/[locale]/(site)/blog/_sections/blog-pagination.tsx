import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { blogQuery } from "@/features/blog/index-params";
import type { PostCategory } from "@/features/blog/schema";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const pillClass =
  "inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border px-4 text-label transition-[background-color,border-color,color] duration-(--duration-base) ease-out";

/** Previous / numbered / next page links; each lands on the top of the list (`#artikel`). */
export async function BlogPagination({
  page,
  totalPages,
  category,
}: {
  page: number;
  totalPages: number;
  category?: PostCategory;
}) {
  if (totalPages <= 1) return null;
  const t = await getTranslations("Blog.pagination");
  const hrefFor = (target: number) => ({
    pathname: "/blog" as const,
    query: blogQuery({ category, page: target }),
    hash: "artikel",
  });

  return (
    <nav aria-label={t("label")} className="flex flex-col items-center gap-3">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {page > 1 && (
          <li>
            <Link
              href={hrefFor(page - 1)}
              rel="prev"
              className={cn(
                pillClass,
                "border-border/70 bg-card text-foreground hover:border-primary/40 hover:text-primary",
              )}
            >
              <ChevronLeftIcon aria-hidden className="size-4" />
              <span className="max-sm:sr-only">{t("previous")}</span>
            </Link>
          </li>
        )}
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((target) => (
          <li key={target}>
            <Link
              href={hrefFor(target)}
              aria-label={t("page", { page: target })}
              aria-current={target === page ? "page" : undefined}
              className={cn(
                pillClass,
                "px-0",
                target === page
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/70 bg-card text-foreground hover:border-primary/40 hover:text-primary",
              )}
            >
              {target}
            </Link>
          </li>
        ))}
        {page < totalPages && (
          <li>
            <Link
              href={hrefFor(page + 1)}
              rel="next"
              className={cn(
                pillClass,
                "border-border/70 bg-card text-foreground hover:border-primary/40 hover:text-primary",
              )}
            >
              <span className="max-sm:sr-only">{t("next")}</span>
              <ChevronRightIcon aria-hidden className="size-4" />
            </Link>
          </li>
        )}
      </ul>
      <p className="text-caption text-muted-foreground">
        {t("pageOf", { page, total: totalPages })}
      </p>
    </nav>
  );
}
