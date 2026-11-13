/**
 * Loads the checked-in region dataset into the `regions` table (`pnpm db:regions`).
 *
 * Idempotent: rows are upserted by code, so re-running after a dataset refresh updates names and
 * parents in place. Codes that exist in the database but not in the dataset are reported, never
 * deleted — units or leads may still reference them. Finishes with a timing probe of the two
 * queries the site runs most (name search, children of a region) against the < 100 ms target
 * from `docs/ROADMAP.md` Phase 3.
 */
import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

// `@next/env` is CommonJS, so ESM gets its exports through the default import.
import nextEnv from "@next/env";
import { sql } from "drizzle-orm";

import { buildRegionRows, countByLevel, parseRegionsCsv, type RegionImportRow } from "./parse";

// `.env.local` must be loaded before `@/lib/env` is evaluated, hence the dynamic imports below.
nextEnv.loadEnvConfig(process.cwd());

const BATCH_SIZE = 2000;
const SEARCH_BUDGET_MS = 100;

async function main() {
  const [{ db, closeDb }, { regions }] = await Promise.all([
    import("@/db/client"),
    import("@/db/schema"),
  ]);

  const csv = await readFile(new URL("regions.csv", import.meta.url), "utf8");
  const { rows, skipped, invalid } = buildRegionRows(parseRegionsCsv(csv));
  if (invalid.length > 0 || skipped.length > 0) {
    throw new Error("regions.csv is inconsistent; rebuild it with `pnpm db:regions:build`.");
  }

  const started = performance.now();
  await db.transaction(async (tx) => {
    for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
      const batch: RegionImportRow[] = rows.slice(offset, offset + BATCH_SIZE);
      await tx
        .insert(regions)
        .values(batch)
        .onConflictDoUpdate({
          target: regions.code,
          set: {
            name: sql`excluded.name`,
            parentCode: sql`excluded.parent_code`,
            level: sql`excluded.level`,
          },
        });
    }
  });
  console.log(`Upserted ${rows.length} regions in ${Math.round(performance.now() - started)} ms`);
  console.table(countByLevel(rows));

  const known = new Set(rows.map((row) => row.code));
  const stored = await db.select({ code: regions.code, name: regions.name }).from(regions);
  const stale = stored.filter((row) => !known.has(row.code));
  if (stale.length > 0) {
    console.warn(`${stale.length} stored regions are no longer in the dataset (kept):`);
    for (const row of stale.slice(0, 20)) console.warn(`  ${row.code}  ${row.name}`);
  }

  // Planner statistics matter for the trigram index to be chosen right after a bulk load.
  await db.execute(sql`analyze ${regions}`);

  const probes: Array<[string, () => Promise<unknown>]> = [
    [
      "name search (ILIKE, trigram index)",
      () =>
        db
          .select({ code: regions.code, name: regions.name })
          .from(regions)
          .where(sql`${regions.name} ilike ${"%cibinong%"}`)
          .limit(10),
    ],
    [
      "children of a regency",
      () =>
        db
          .select({ code: regions.code, name: regions.name })
          .from(regions)
          .where(sql`${regions.parentCode} = ${"32.01"}`)
          .orderBy(regions.name),
    ],
  ];
  let slow = false;
  for (const [label, run] of probes) {
    await run(); // warm up the connection and plan cache
    const start = performance.now();
    await run();
    const ms = performance.now() - start;
    slow ||= ms > SEARCH_BUDGET_MS;
    console.log(
      `${ms > SEARCH_BUDGET_MS ? "SLOW" : "ok  "} ${ms.toFixed(1).padStart(6)} ms  ${label}`,
    );
  }
  if (slow) console.warn(`A probe exceeded the ${SEARCH_BUDGET_MS} ms budget; check the indexes.`);

  await closeDb();
}

main().catch(async (error: unknown) => {
  console.error(error);
  process.exit(1);
});
