/**
 * URL of an admin list with its filter in the query string. Empty values, `false` and page 1 are
 * left out, so the plain list keeps its plain URL.
 */
export function listHref(
  base: string,
  params: Record<string, string | number | boolean | null | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "" || value === false) continue;
    if (key === "page" && Number(value) <= 1) continue;
    search.set(key, value === true ? "1" : String(value));
  }
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

/** First value of a search param (Next gives arrays for repeated keys). */
export const firstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/** A positive page number from the URL, 1 otherwise. */
export function pageParam(value: string | string[] | undefined): number {
  const page = Number.parseInt(firstParam(value) ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}
