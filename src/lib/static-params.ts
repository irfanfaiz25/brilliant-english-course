/**
 * Path segment of the stand-in route prerendered when a dynamic route has no data yet. No slug
 * can take this value (slugs are lowercase words and hyphens), so its page renders 404.
 */
export const placeholderParam = "_";

/**
 * With Cache Components, `generateStaticParams` must return at least one result, or the build
 * fails. A fresh production database (no posts, no units yet) or an admin deleting the last one
 * would break every deploy, so an empty list becomes one placeholder route whose page is a 404.
 */
export function atLeastOneParam<T>(params: readonly T[], placeholder: T): T[] {
  return params.length > 0 ? [...params] : [placeholder];
}
