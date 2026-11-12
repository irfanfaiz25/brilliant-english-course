import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "@/lib/env";

import * as schema from "./schema";

/**
 * Shared connection pool. Reused across hot reloads in development to avoid exhausting
 * connections. Only feature `queries.ts` / `service.ts` modules and the worker may import this.
 */
const globalForDb = globalThis as typeof globalThis & { __becPool?: Pool };

const pool =
  globalForDb.__becPool ??
  new Pool({ connectionString: env.DATABASE_URL, max: env.DATABASE_POOL_MAX });

if (env.NODE_ENV !== "production") {
  globalForDb.__becPool = pool;
}

export const db = drizzle({ client: pool, schema, casing: "snake_case" });
export type Database = typeof db;
