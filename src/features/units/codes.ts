import { slugify } from "@/lib/slug";

/**
 * Province part of a unit code: ISO 3166-2:ID subdivision letters per Kemendagri province code
 * ("32" → "JB", so a unit in West Java is "BEC-JB-0123").
 */
export const provinceAbbreviations: Readonly<Record<string, string>> = {
  "11": "AC",
  "12": "SU",
  "13": "SB",
  "14": "RI",
  "15": "JA",
  "16": "SS",
  "17": "BE",
  "18": "LA",
  "19": "BB",
  "21": "KR",
  "31": "JK",
  "32": "JB",
  "33": "JT",
  "34": "YO",
  "35": "JI",
  "36": "BT",
  "51": "BA",
  "52": "NB",
  "53": "NT",
  "61": "KB",
  "62": "KT",
  "63": "KS",
  "64": "KI",
  "65": "KU",
  "71": "SA",
  "72": "ST",
  "73": "SN",
  "74": "SG",
  "75": "GO",
  "76": "SR",
  "81": "MA",
  "82": "MU",
  "91": "PA",
  "92": "PB",
  "93": "PS",
  "94": "PT",
  "95": "PE",
  "96": "PD",
};

const UNIT_CODE = /^BEC-([A-Z]{2})-(\d{4})$/;

/**
 * The next free code in the unit's province: one above the highest number used there so far
 * (deleted units keep their codes, so a code is never reused).
 */
export function nextUnitCode(villageCode: string, existingCodes: readonly string[]): string {
  const abbreviation = provinceAbbreviations[villageCode.slice(0, 2)];
  if (!abbreviation) throw new Error(`No unit code prefix for province ${villageCode.slice(0, 2)}`);
  const highest = existingCodes.reduce((max, code) => {
    const match = UNIT_CODE.exec(code);
    return match?.[1] === abbreviation ? Math.max(max, Number(match[2])) : max;
  }, 0);
  return `BEC-${abbreviation}-${String(highest + 1).padStart(4, "0")}`;
}

/** URL slug suggested from a unit name: "Unit Sukamaju" → "sukamaju". */
export function unitSlugFromName(name: string): string {
  return slugify(name.replace(/^\s*unit\s+/i, ""));
}
