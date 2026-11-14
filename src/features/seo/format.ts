import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

import type { DerivedSeo, SeoOverride } from "./schema";

/** Added to every page title except complete ones (home page); used by the root layout. */
export const titleTemplate = `%s · ${siteConfig.shortName}`;

/** The title as search results show it, for admin previews. */
export function formatPageTitle(title: string, absolute: boolean): string {
  return absolute ? title : titleTemplate.replace("%s", title);
}

/**
 * Resolves a page's metadata (ADR-008): admin override → content-derived default; the global
 * default description comes from the root layout when neither has one. `noindex` keeps links
 * followed so the rest of the site is still crawled.
 */
export function applySeoOverride(
  derived: DerivedSeo,
  override: SeoOverride | null,
): Pick<Metadata, "title" | "description" | "robots"> {
  const title = override?.title ?? derived.title;
  const description = override?.description ?? derived.description;
  return {
    title: derived.absoluteTitle ? { absolute: title } : title,
    ...(description ? { description } : {}),
    ...(override?.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
