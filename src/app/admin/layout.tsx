import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { adminLocale } from "@/config/admin-routes";
import { siteConfig } from "@/config/site";
import { adminClientNamespaces, pickClientMessages } from "@/i18n/client-messages";
import { brandColors } from "@/lib/design-tokens";
import { publicEnv } from "@/lib/public-env";
import { poppins } from "@/styles/fonts";

import "@/styles/globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return {
    metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
    title: { default: t("metaTitle"), template: `%s · ${siteConfig.shortName} Admin` },
    // The staff area is never indexed, whatever the robots file says.
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  themeColor: brandColors.teal500,
};

/**
 * Root layout of the staff area (`/admin`). Indonesian only and outside the `[locale]` tree, so
 * the locale is passed explicitly to every next-intl call (ADR-005, ADR-025).
 */
export default async function AdminRootLayout({ children }: { children: ReactNode }) {
  const messages = await getMessages({ locale: adminLocale });

  return (
    // Scroll padding keeps headings clear of the sticky top bar when Next scrolls to a new page.
    <html lang={adminLocale} className={`${poppins.variable} scroll-pt-24`}>
      <body className="flex min-h-dvh flex-col bg-surface">
        <NextIntlClientProvider
          locale={adminLocale}
          messages={pickClientMessages(messages, adminClientNamespaces)}
        >
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
