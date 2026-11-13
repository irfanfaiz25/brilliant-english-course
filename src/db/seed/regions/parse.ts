import { REGION_CODE_PATTERN, type RegionLevel } from "@/features/regions/schema";
import { parentRegionCode, regionLevel } from "@/features/regions/service";

/** One region as stored in the checked-in dataset (`regions.csv`). */
export type RegionRecord = { code: string; name: string };

/** One region ready for the `regions` table. */
export type RegionImportRow = RegionRecord & { parentCode: string | null; level: RegionLevel };

/** Column order of `regions.csv`. */
export const CSV_HEADER = "code,name";

/**
 * Extracts `(code, name)` tuples from the upstream MySQL dump (`db/wilayah.sql` in
 * cahyadsn/wilayah). The file is a sequence of `INSERT INTO wilayah (kode, nama) VALUES (...)`
 * statements; names may contain MySQL-escaped quotes (`\'`).
 */
export function parseWilayahSql(sql: string): RegionRecord[] {
  const tuple = /\('([0-9.]+)','((?:[^'\\]|\\.)*)'\)/g;
  const records: RegionRecord[] = [];
  for (const match of sql.matchAll(tuple)) {
    const [, code, rawName] = match;
    if (code === undefined || rawName === undefined) continue;
    records.push({ code, name: rawName.replace(/\\(.)/g, "$1").trim() });
  }
  return records;
}

export type RegionBuildResult = {
  rows: RegionImportRow[];
  /** Codes whose parent (or an ancestor) is missing upstream; not importable under the FK. */
  skipped: RegionRecord[];
  /** Records with a malformed code or empty name. */
  invalid: RegionRecord[];
};

/**
 * Validates records, derives level and parent from the code and drops rows whose ancestors are
 * missing, so the result always satisfies the self-referencing foreign key. Rows are ordered
 * province → village so they can be inserted in a single pass.
 */
export function buildRegionRows(records: readonly RegionRecord[]): RegionBuildResult {
  const invalid: RegionRecord[] = [];
  const valid = new Map<string, RegionRecord>();
  for (const record of records) {
    if (!REGION_CODE_PATTERN.test(record.code) || record.name.length === 0) {
      invalid.push(record);
    } else {
      valid.set(record.code, record);
    }
  }

  const rows: RegionImportRow[] = [];
  const skipped: RegionRecord[] = [];
  const kept = new Set<string>();
  const byLevel = [...valid.values()].sort((a, b) => a.code.length - b.code.length);
  for (const record of byLevel) {
    const parentCode = parentRegionCode(record.code);
    if (parentCode !== null && !kept.has(parentCode)) {
      skipped.push(record);
      continue;
    }
    kept.add(record.code);
    rows.push({ ...record, parentCode, level: regionLevel(record.code) });
  }
  return { rows, skipped, invalid };
}

/** Counts rows per level, in `regionLevels` order. */
export function countByLevel(rows: readonly RegionImportRow[]): Record<RegionLevel, number> {
  const counts: Record<RegionLevel, number> = { province: 0, regency: 0, district: 0, village: 0 };
  for (const row of rows) counts[row.level] += 1;
  return counts;
}

function csvField(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

/** Serializes records as RFC 4180 CSV with a header row and `\n` line endings. */
export function toRegionsCsv(records: readonly RegionRecord[]): string {
  const lines = records.map((record) => `${csvField(record.code)},${csvField(record.name)}`);
  return [CSV_HEADER, ...lines].join("\n") + "\n";
}

/** Parses `regions.csv` back into records; the header row is required. */
export function parseRegionsCsv(csv: string): RegionRecord[] {
  const lines = csv.split(/\r?\n/);
  if (lines[0] !== CSV_HEADER) throw new Error(`Unexpected CSV header: ${lines[0]}`);
  const records: RegionRecord[] = [];
  for (const line of lines.slice(1)) {
    if (line === "") continue;
    const comma = line.indexOf(",");
    if (comma === -1) throw new Error(`Malformed CSV line: ${line}`);
    const code = line.slice(0, comma);
    let name = line.slice(comma + 1);
    if (name.startsWith('"')) {
      if (!name.endsWith('"')) throw new Error(`Malformed CSV line: ${line}`);
      name = name.slice(1, -1).replaceAll('""', '"');
    }
    records.push({ code, name });
  }
  return records;
}
