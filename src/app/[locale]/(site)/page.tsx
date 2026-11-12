import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { LocaleSwitcher } from "@/components/site/locale-switcher";
import { siteConfig } from "@/config/site";
import { routing } from "@/i18n/routing";
import { localizedAlternates } from "@/lib/seo/alternates";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  return { alternates: localizedAlternates("/", locale) };
}

// Temporary placeholder until the home page sections are built (Phase 5a).
export default async function HomePage() {
  const t = await getTranslations("HomePage");

  return (
    <main className="mx-auto flex w-full max-w-page flex-1 flex-col justify-center gap-4 px-5 py-16">
      <LocaleSwitcher />
      <p className="text-overline text-partner uppercase">{t("overline")}</p>
      <h1 className="text-display text-primary">{t("title")}</h1>
      <p className="text-body-lg text-muted-foreground">{siteConfig.name}</p>
    </main>
  );
}
