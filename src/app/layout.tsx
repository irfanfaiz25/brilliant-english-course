import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";

import { siteConfig } from "@/config/site";
import { brandColors } from "@/lib/design-tokens";
import { publicEnv } from "@/lib/public-env";

import "@/styles/globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.shortName}`,
  },
  applicationName: siteConfig.name,
};

export const viewport: Viewport = {
  themeColor: brandColors.teal500,
};

// The `lang` attribute becomes locale-aware when next-intl routing lands in Phase 2.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={siteConfig.defaultLocale} className={poppins.variable}>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
