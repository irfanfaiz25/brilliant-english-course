import "server-only";

import { pingDatabase } from "@/db/client";
import { env } from "@/lib/env";

/** Longest wait for the database before the check reports it as down. */
const DATABASE_TIMEOUT_MS = 3000;

export type HealthReport =
  { status: "ok"; version: string } | { status: "error"; version: string; database: "unreachable" };

/**
 * The app's health (ADR-043): it runs, and the database answers within the timeout. `version`
 * is the release (`APP_VERSION`), so a deploy can tell the new container from the old one.
 */
export async function checkHealth(): Promise<HealthReport> {
  const version = env.APP_VERSION ?? "dev";
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      pingDatabase(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("Database timeout")), DATABASE_TIMEOUT_MS);
      }),
    ]);
    return { status: "ok", version };
  } catch {
    return { status: "error", version, database: "unreachable" };
  } finally {
    clearTimeout(timer);
  }
}
