"use client";

import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { ComponentProps } from "react";

import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type LinkHref = ComponentProps<typeof Link>["href"];

const tones = {
  light: {
    group: "bg-muted",
    item: "text-muted-foreground hover:text-foreground aria-[current=true]:bg-background aria-[current=true]:text-primary aria-[current=true]:shadow-sm",
  },
  dark: {
    group: "bg-white/10",
    item: "text-inverse-muted hover:text-inverse-foreground aria-[current=true]:bg-inverse-foreground aria-[current=true]:text-inverse",
  },
} as const;

/**
 * Segmented ID / EN switch linking to the current page in each locale. Plain links (not a select)
 * so it works without JS and crawlers can follow them.
 */
export function LocaleSwitcher({
  tone = "light",
  className,
}: {
  tone?: keyof typeof tones;
  className?: string;
}) {
  const t = useTranslations("LocaleSwitcher");
  const activeLocale = useLocale();
  const pathname = usePathname();
  const params = useParams();
  // `pathname` is the internal route template (e.g. "/blog/[slug]"); params fill it in.
  const href = { pathname, params } as LinkHref;

  return (
    <nav aria-label={t("label")} className={className}>
      <ul className={cn("flex items-center gap-0.5 rounded-full p-1", tones[tone].group)}>
        {routing.locales.map((locale) => (
          <li key={locale}>
            <Link
              href={href}
              locale={locale}
              hrefLang={locale}
              lang={locale}
              aria-label={t("locale", { locale })}
              aria-current={locale === activeLocale ? "true" : undefined}
              className={cn(
                "inline-flex h-8 min-w-11 items-center justify-center rounded-full px-3 text-caption font-semibold uppercase transition-[background-color,color,box-shadow] duration-(--duration-base) ease-out",
                tones[tone].item,
              )}
            >
              {locale}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
