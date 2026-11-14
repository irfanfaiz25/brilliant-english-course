import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { adminLocale } from "@/config/admin-routes";
import type { PageOverrides } from "@/features/seo/admin-queries";
import { PageSeoEditor, type PageSeoContext } from "@/features/seo/components/page-seo-editor";
import { seoPages } from "@/features/seo/pages";
import { seoPageKeys, type PageSeoInput, type SeoPageKey } from "@/features/seo/schema";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/seo/absolute-url";

type PageSeoListProps = {
  overrides: PageOverrides;
  fallbackDescriptions: Record<Locale, string>;
  canEdit: boolean;
  canSetNoindex: boolean;
};

/**
 * The static pages with their override status and an editor each. A list rather than a table so
 * it reads well at 360 px without horizontal scrolling.
 */
export async function PageSeoList({
  overrides,
  fallbackDescriptions,
  canEdit,
  canSetNoindex,
}: PageSeoListProps) {
  const t = await getTranslations({ locale: adminLocale, namespace: "AdminSeo.pages" });
  const rows = await Promise.all(
    seoPageKeys.map(async (page) => ({
      page,
      contexts: await contextsFor(page, fallbackDescriptions),
    })),
  );

  return (
    <ul className="flex flex-col divide-y divide-border/60">
      {rows.map(({ page, contexts }) => {
        const stored = overrides[page] ?? {};
        const values = routing.locales.map((locale) => stored[locale]);
        const customised = values.some((value) => value?.title || value?.description);
        const noindex = values.some((value) => value?.noindex);
        const pageName = t(`names.${page}`);

        return (
          <li key={page} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-body font-semibold text-foreground">{pageName}</span>
                <span className="truncate text-caption text-muted-foreground">
                  {getPathname({ href: seoPages[page].href, locale: routing.defaultLocale })}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {customised ? (
                  <Badge variant="primary" dot>
                    {t("statusCustom")}
                  </Badge>
                ) : (
                  <Badge variant="neutral">{t("statusDefault")}</Badge>
                )}
                {noindex && (
                  <Badge variant="warning" dot>
                    {t("statusNoindex")}
                  </Badge>
                )}
              </div>
            </div>
            <PageSeoEditor
              pageName={pageName}
              defaultValues={toFormValues(page, overrides)}
              contexts={contexts}
              canEdit={canEdit}
              canSetNoindex={canSetNoindex}
            />
          </li>
        );
      })}
    </ul>
  );
}

async function contextsFor(
  page: SeoPageKey,
  fallbackDescriptions: Record<Locale, string>,
): Promise<Record<Locale, PageSeoContext>> {
  const { href, derive } = seoPages[page];
  const entries = await Promise.all(
    routing.locales.map(async (locale) => {
      const context: PageSeoContext = {
        derived: await derive(locale),
        fallbackDescription: fallbackDescriptions[locale],
        url: absoluteUrl(getPathname({ href, locale })),
      };
      return [locale, context] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<Locale, PageSeoContext>;
}

/** Stored overrides as form values: `null` becomes an empty field (= use the default). */
function toFormValues(page: SeoPageKey, overrides: PageOverrides): PageSeoInput {
  const stored = overrides[page] ?? {};
  const text = (locale: Locale) => ({
    title: stored[locale]?.title ?? "",
    description: stored[locale]?.description ?? "",
  });
  return {
    page,
    texts: { id: text("id"), en: text("en") },
    noindex: routing.locales.some((locale) => stored[locale]?.noindex),
  };
}
