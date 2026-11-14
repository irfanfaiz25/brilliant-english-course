import "server-only";

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { siteConfig } from "@/config/site";
import { getQuotaRules } from "@/features/quota/queries";
import type { Locale, StaticPathname } from "@/i18n/routing";
import { localizedAlternates } from "@/lib/seo/alternates";

import { applySeoOverride } from "./format";
import { getSeoOverride } from "./queries";
import type { DerivedSeo, SeoPageKey } from "./schema";

type SeoPage = {
  href: StaticPathname;
  /** Title and description the page derives from its messages, before any override. */
  derive: (locale: Locale) => Promise<DerivedSeo>;
};

const fromMessages = (title: string, description: string): DerivedSeo => ({
  title,
  description,
  absoluteTitle: false,
});

/** Static public pages with admin-editable metadata, in the public navigation order. */
export const seoPages: Record<SeoPageKey, SeoPage> = {
  home: {
    href: "/",
    derive: async (locale) => {
      const t = await getTranslations({ locale, namespace: "Home" });
      // The home page has no description of its own: the site-wide default applies.
      return {
        title: `${siteConfig.name} — ${t("metaTitle")}`,
        description: null,
        absoluteTitle: true,
      };
    },
  },
  program: {
    href: "/program",
    derive: async (locale) => {
      const t = await getTranslations({ locale, namespace: "Program" });
      return fromMessages(t("metaTitle"), t("metaDescription"));
    },
  },
  finder: {
    href: "/cek-unit",
    derive: async (locale) => {
      const t = await getTranslations({ locale, namespace: "Finder" });
      return fromMessages(t("metaTitle"), t("metaDescription"));
    },
  },
  units: {
    href: "/unit",
    derive: async (locale) => {
      const t = await getTranslations({ locale, namespace: "UnitPages.directory" });
      return fromMessages(t("metaTitle"), t("metaDescription"));
    },
  },
  partnership: {
    href: "/kemitraan",
    derive: async (locale) => {
      const t = await getTranslations({ locale, namespace: "Partnership" });
      return fromMessages(
        t("metaTitle"),
        t("metaDescription", { max: (await getQuotaRules()).unitsPerVillage }),
      );
    },
  },
  blog: {
    href: "/blog",
    derive: async (locale) => {
      const t = await getTranslations({ locale, namespace: "Blog" });
      return fromMessages(t("metaTitle"), t("metaDescription"));
    },
  },
  contact: {
    href: "/kontak",
    derive: async (locale) => {
      const t = await getTranslations({ locale, namespace: "Contact" });
      return fromMessages(t("metaTitle"), t("metaDescription"));
    },
  },
};

/**
 * `generateMetadata` result of a static page: its own title and description, the admin override
 * on top, plus canonical and hreflang alternates. Variants with query strings share the canonical.
 */
export async function pageMetadata(page: SeoPageKey, locale: Locale): Promise<Metadata> {
  const { href, derive } = seoPages[page];
  const [derived, override] = await Promise.all([
    derive(locale),
    getSeoOverride("page", page, locale),
  ]);
  return { ...applySeoOverride(derived, override), alternates: localizedAlternates(href, locale) };
}
