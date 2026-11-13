import { regionLevels, type RegionLevel } from "./schema";

/** Level of a Kemendagri code, from the number of dot-separated parts. */
export function regionLevel(code: string): RegionLevel {
  const level = regionLevels[code.split(".").length - 1];
  if (!level) throw new Error(`Invalid region code: ${code}`);
  return level;
}

/** Parent code ("32.01.01" → "32.01"); `null` for a province. */
export function parentRegionCode(code: string): string | null {
  const parts = code.split(".");
  return parts.length > 1 ? parts.slice(0, -1).join(".") : null;
}

/** All codes from the province down to `code` itself: "32.01.01" → ["32", "32.01", "32.01.01"]. */
export function regionCodePath(code: string): string[] {
  const parts = code.split(".");
  return parts.map((_, index) => parts.slice(0, index + 1).join("."));
}

/** Official long prefixes → the short forms people use ("Kab. Bogor", "DKI Jakarta"). */
const SHORT_PREFIXES: ReadonlyArray<[RegExp, string]> = [
  [/^Kabupaten Administrasi\s+/, "Kab. "],
  [/^Kabupaten\s+/, "Kab. "],
  [/^Kota Administrasi\s+/, "Kota "],
  [/^Daerah Khusus Ibukota\s+/, "DKI "],
  [/^Daerah Istimewa\s+/, "DI "],
];

/**
 * Display name of a region. The `regions` table keeps the official names (ADR-023); cards, filters
 * and URLs use the short form, so slugs stay `kab-bogor` and `dki-jakarta`.
 */
export function shortRegionName(name: string): string {
  for (const [pattern, replacement] of SHORT_PREFIXES) {
    if (pattern.test(name)) return name.replace(pattern, replacement);
  }
  return name;
}

/** Whether `code` is `ancestor` or lies inside it (a village inside a regency, …). */
export function isWithinRegion(code: string, ancestor: string): boolean {
  return code === ancestor || code.startsWith(`${ancestor}.`);
}
