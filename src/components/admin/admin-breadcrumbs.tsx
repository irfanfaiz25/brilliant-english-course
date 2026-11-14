import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { adminNavigation, type AdminIcon } from "@/config/admin-navigation";
import { adminLocale, adminRoutes } from "@/config/admin-routes";
import { cn } from "@/lib/utils";

/** A page above the current one: a sidebar module by key, or any page by label and URL. */
export type AdminCrumb = AdminIcon | { label: string; href: string };

const navItems = adminNavigation.flatMap((group) => group.items);

const linkClass =
  "rounded-sm underline-offset-4 transition-colors duration-(--duration-fast) hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/**
 * Where an admin page sits: Ringkasan › its parents › the page itself (not a link). Phones show
 * only "‹ parent", so the trail never wraps above the title; the full trail starts at `sm`.
 */
export async function AdminBreadcrumbs({
  parents,
  current,
}: {
  /** Pages between Ringkasan and this one, outermost first (usually the module's list). */
  parents: readonly AdminCrumb[];
  current: string;
}) {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  const trail: { label: string; href: string }[] = [
    { label: t("nav.items.overview"), href: adminRoutes.home },
    ...parents.map((crumb) => {
      if (typeof crumb !== "string") return crumb;
      const item = navItems.find((navItem) => navItem.key === crumb);
      return { label: t(`nav.items.${crumb}`), href: item?.href ?? adminRoutes.home };
    }),
  ];
  const parent = trail.length - 1;

  return (
    <nav aria-label={t("breadcrumbs")}>
      <ol className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-body-sm text-muted-foreground">
        {trail.map((crumb, index) => (
          <li
            key={crumb.href}
            className={cn("items-center gap-1.5", index === parent ? "flex" : "hidden sm:flex")}
          >
            {index > 0 && (
              <ChevronRightIcon aria-hidden className="hidden size-4 text-neutral-400 sm:block" />
            )}
            {index === parent && (
              <ChevronLeftIcon aria-hidden className="size-4 text-primary sm:hidden" />
            )}
            <Link
              href={crumb.href}
              className={cn(
                linkClass,
                index === parent && "font-semibold text-primary sm:font-normal sm:text-inherit",
              )}
            >
              {crumb.label}
            </Link>
          </li>
        ))}
        <li className="hidden min-w-0 items-center gap-1.5 sm:flex">
          <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-neutral-400" />
          <span aria-current="page" className="max-w-xs truncate font-semibold text-foreground">
            {current}
          </span>
        </li>
      </ol>
    </nav>
  );
}
