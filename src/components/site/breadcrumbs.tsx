import { ChevronRightIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { getPathname, Link } from "@/i18n/navigation";
import type { AppPathname, Locale } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/seo/absolute-url";
import { breadcrumbJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = { label: string; href: AppPathname };

/**
 * Visible breadcrumb trail plus matching `BreadcrumbList` structured data.
 * Pass every level from Home to the current page; the last item is marked as the current page.
 */
export async function Breadcrumbs({
  items,
  className,
}: {
  items: readonly BreadcrumbItem[];
  className?: string;
}) {
  const t = await getTranslations("Breadcrumbs");
  const locale = (await getLocale()) as Locale;

  return (
    <nav aria-label={t("label")} className={className}>
      <JsonLd
        data={breadcrumbJsonLd(
          items.map((item) => ({
            name: item.label,
            url: absoluteUrl(getPathname({ href: item.href, locale })),
          })),
        )}
      />
      <ol className="flex flex-wrap items-center gap-1.5 text-body-sm text-muted-foreground">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li key={item.href} className="inline-flex items-center gap-1.5">
              {index > 0 && <ChevronRightIcon aria-hidden className="size-4 text-neutral-400" />}
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "rounded-sm transition-colors duration-(--duration-fast) hover:text-primary",
                  current && "font-semibold text-foreground",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
