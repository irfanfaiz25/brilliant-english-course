/**
 * Refreshes the checked-in region dataset from the upstream Kemendagri mirror.
 *
 *   pnpm db:regions:build            # fetch the pinned upstream commit
 *   pnpm db:regions:build <commit>   # pin a newer commit, then review the CSV diff
 *
 * Writes `src/db/seed/regions/regions.csv` and `regions.meta.json`. The data itself is loaded
 * into a database with `pnpm db:regions` (ADR-023). Only `code,name` is stored: level and parent
 * are derived from the code at import time.
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import {
  buildRegionRows,
  countByLevel,
  parseWilayahSql,
  toRegionsCsv,
} from "../src/db/seed/regions/parse";

const UPSTREAM = {
  repository: "cahyadsn/wilayah",
  path: "db/wilayah.sql",
  license: "MIT",
  /** Commit the dataset was last taken from; pass another SHA as the first argument to move it. */
  commit: "c2eff0881e3c75b8822f8c84ea9d23affc11aadb",
  regulation: "Kepmendagri No. 300.2.2-2430 Tahun 2025",
} as const;

const outDir = new URL("../src/db/seed/regions/", import.meta.url);

async function main() {
  const commit = process.argv[2] ?? UPSTREAM.commit;
  if (!/^[0-9a-f]{40}$/.test(commit))
    throw new Error(`Expected a full commit SHA, got "${commit}"`);

  const url = `https://raw.githubusercontent.com/${UPSTREAM.repository}/${commit}/${UPSTREAM.path}`;
  console.log(`Fetching ${url}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  const sql = await response.text();
  const sha256 = createHash("sha256").update(sql).digest("hex");

  const records = parseWilayahSql(sql);
  const { rows, skipped, invalid } = buildRegionRows(records);
  if (invalid.length > 0) {
    console.error("Invalid records:", invalid);
    throw new Error(`${invalid.length} upstream records have a malformed code or empty name`);
  }

  const meta = {
    source: { ...UPSTREAM, commit, url, sha256 },
    generatedAt: new Date().toISOString(),
    counts: countByLevel(rows),
    total: rows.length,
    /** Villages whose district is missing upstream; re-check them after each refresh. */
    skippedCount: skipped.length,
    skipped,
  };

  await mkdir(outDir, { recursive: true });
  await writeFile(new URL("regions.csv", outDir), toRegionsCsv(rows), "utf8");
  await writeFile(new URL("regions.meta.json", outDir), JSON.stringify(meta, null, 2) + "\n");

  console.log(`Wrote ${rows.length} regions to ${fileURLToPath(outDir)}`);
  console.table(meta.counts);
  if (skipped.length > 0) {
    console.warn(`Skipped ${skipped.length} records whose parent is missing upstream (see meta).`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
