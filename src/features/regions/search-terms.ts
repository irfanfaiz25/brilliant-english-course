import { limits } from "@/config/limits";

/** Terms a query may hold: "dusun, desa, kecamatan, kabupaten" at most. */
export const MAX_REGION_TERMS = 4;

/**
 * Splits a region query into search terms (ADR-047): lowercase, single spaces, one term per
 * comma ("sanggrahan, pelem" → ["sanggrahan", "pelem"]), "kab"/"kab." read as "kabupaten" the
 * way official names are written, duplicates dropped. A term needs `minChars` letters; the
 * first term — the place itself — must have them, or the query has no terms at all.
 */
export function parseRegionQuery(text: string): string[] {
  const terms = text
    .toLowerCase()
    .split(",")
    .map((term) =>
      term
        .trim()
        .replace(/\s+/g, " ")
        // Only "kab." or "kab " — never the start of "kabupaten" itself.
        .replace(/^kab(?:\.\s*|\s+)(?=\S)/, "kabupaten "),
    );
  const [first, ...rest] = terms;
  if (!first || first.length < limits.regionSearch.minChars) return [];
  const usable = [first, ...rest.filter((term) => term.length >= limits.regionSearch.minChars)];
  return [...new Set(usable)].slice(0, MAX_REGION_TERMS);
}

/** A term as a LIKE pattern where the visitor's `%` and `_` are literal characters. */
export function likeLiteral(term: string): string {
  return term.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * The part of a term compared by spelling similarity: without "kabupaten"/"kota", which every
 * regency name shares and would otherwise make unrelated regencies look alike.
 */
export function fuzzyTerm(term: string): string {
  return term.replace(/^(kabupaten|kota) (?=\S)/, "");
}
