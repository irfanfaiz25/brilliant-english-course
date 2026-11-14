"use client";

import { useTranslations } from "next-intl";
import { Tabs } from "radix-ui";
import type { ReactNode } from "react";

import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type LocaleTabsProps = {
  value: Locale;
  onValueChange: (locale: Locale) => void;
  /** Locales whose fields have errors; their tab shows a dot (DESIGN.md § 6). */
  invalid: readonly Locale[];
  /** The fields of one locale. Every panel stays mounted so the form keeps all values. */
  children: (locale: Locale) => ReactNode;
};

/** `ID | EN` tabs for the localized fields of a long admin form. */
export function LocaleTabs({ value, onValueChange, invalid, children }: LocaleTabsProps) {
  const t = useTranslations("AdminForms.locales");
  return (
    <Tabs.Root
      value={value}
      onValueChange={(next) => onValueChange(next as Locale)}
      className="flex flex-col gap-5"
    >
      <Tabs.List
        aria-label={t("label")}
        className="inline-flex w-fit gap-1 rounded-xl border border-border/70 bg-background/70 p-1"
      >
        {routing.locales.map((locale) => (
          <Tabs.Trigger
            key={locale}
            value={locale}
            className={cn(
              "relative inline-flex h-10 items-center gap-2 rounded-lg px-4 text-body-sm font-semibold text-muted-foreground",
              "transition-colors duration-(--duration-fast) hover:text-foreground",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
            )}
          >
            {t(locale)}
            {invalid.includes(locale) && (
              <>
                <span aria-hidden className="size-2 rounded-full bg-destructive" />
                <span className="sr-only">{t("hasErrors")}</span>
              </>
            )}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {routing.locales.map((locale) => (
        <Tabs.Content
          key={locale}
          value={locale}
          forceMount
          lang={locale}
          data-locale-panel={locale}
          className="flex flex-col gap-5 outline-none data-[state=inactive]:hidden"
        >
          {children(locale)}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
