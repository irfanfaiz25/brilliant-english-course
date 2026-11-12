"use client";

import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { ComponentProps } from "react";

import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type LinkHref = ComponentProps<typeof Link>["href"];

/**
 * Links to the current page in every locale. Plain links (not a select) so it works without JS
 * and crawlers can follow them. Styling is finalized with the site shell (Phase 2d).
 */
export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const activeLocale = useLocale();
  const pathname = usePathname();
  const params = useParams();
  // `pathname` is the internal route template (e.g. "/blog/[slug]"); params fill it in.
  const href = { pathname, params } as LinkHref;

  return (
    <nav aria-label={t("label")}>
      <ul className="flex items-center gap-1 text-label">
        {routing.locales.map((locale) => {
          const isActive = locale === activeLocale;
          return (
            <li key={locale}>
              <Link
                href={href}
                locale={locale}
                hrefLang={locale}
                lang={locale}
                aria-current={isActive ? "true" : undefined}
                className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors duration-(--duration-fast) hover:bg-muted hover:text-foreground aria-[current=true]:bg-primary-soft aria-[current=true]:text-primary"
              >
                {t("locale", { locale })}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
