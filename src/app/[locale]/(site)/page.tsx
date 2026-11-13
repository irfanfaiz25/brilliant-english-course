import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { DecorBlob } from "@/components/site/decor-blob";
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
    <section className="relative isolate flex flex-1 overflow-hidden bg-gradient-soft">
      <DecorBlob tone="highlight" className="top-10 -right-20 size-72" />
      <DecorBlob tone="primary" className="bottom-0 -left-24 size-80" />
      <div className="mx-auto flex w-full max-w-page flex-col justify-center gap-4 px-5 py-24 md:px-8">
        <p className="text-overline text-partner uppercase">{t("overline")}</p>
        <h1 className="text-display text-primary">{t("title")}</h1>
        <p className="text-body-lg text-muted-foreground">{siteConfig.name}</p>
      </div>
    </section>
  );
}
