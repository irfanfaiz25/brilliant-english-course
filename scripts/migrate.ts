/**
 * Applies pending migrations from `src/db/migrations` (ADR-043). The deploy runs it from the tools
 * image before the new app starts; if it fails, the deploy stops and the running release stays.
 *
 *   pnpm db:migrate:deploy
 *
 * Unlike `pnpm db:migrate` (drizzle-kit, local development) it needs no dev tooling config and holds
 * a Postgres advisory lock, so two deploys can never migrate at the same time. It uses the same
 * `drizzle.__drizzle_migrations` journal as drizzle-kit, so both see the same history.
 */
import nextEnv from "@next/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";

nextEnv.loadEnvConfig(process.cwd());

/** Any fixed number shared by every deploy of this app. */
const MIGRATION_LOCK_ID = 4_203_117;
const MIGRATIONS_FOLDER = "src/db/migrations";

async function main() {
  // Imported after the env is loaded: it validates the environment on import.
  const { env } = await import("@/lib/env");
  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("select pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);
    const started = Date.now();
    await migrate(drizzle({ client }), { migrationsFolder: MIGRATIONS_FOLDER });
    const { rows } = await client.query<{ count: string }>(
      "select count(*) from drizzle.__drizzle_migrations",
    );
    console.log(
      `Migrations up to date (${rows[0]?.count ?? "?"} applied, ${Date.now() - started} ms).`,
    );
  } finally {
    await client.query("select pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]).catch(() => {});
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
