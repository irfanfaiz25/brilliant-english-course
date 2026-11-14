import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";

import { MotionProvider } from "@/components/motion/motion-provider";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config/site";
import { titleTemplate } from "@/features/seo/format";
import { getSeoDefaults } from "@/features/seo/queries";
import { pickClientMessages } from "@/i18n/client-messages";
import { localeRegion, routing } from "@/i18n/routing";
import { brandColors } from "@/lib/design-tokens";
import { publicEnv } from "@/lib/public-env";
import { poppins } from "@/styles/fonts";

import "@/styles/globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const [t, seoDefaults] = await Promise.all([
    getTranslations({ locale, namespace: "Metadata" }),
    getSeoDefaults(),
  ]);

  return {
    metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
    title: { default: siteConfig.name, template: titleTemplate },
    // Global default (ADR-008): pages without a description of their own inherit this one.
    description: seoDefaults?.description[locale] ?? t("description"),
    applicationName: siteConfig.name,
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      locale: localeRegion[locale],
      alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => localeRegion[l]),
    },
  };
}

export const viewport: Viewport = {
  themeColor: brandColors.teal500,
};

/** Root layout of the public site. The admin area has its own root layout (Phase 3). */
export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale} className={poppins.variable} data-scroll-behavior="smooth">
      <head>
        {/* Without JS, content waiting for a scroll reveal must still be visible. */}
        <noscript>
          <style>{"[data-reveal]{opacity:1!important;transform:none!important}"}</style>
        </noscript>
      </head>
      <body className="flex min-h-dvh flex-col">
        <NextIntlClientProvider messages={pickClientMessages(messages)}>
          <MotionProvider>{children}</MotionProvider>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
