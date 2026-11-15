import { connection } from "next/server";

import { checkHealth } from "@/lib/health";

/**
 * Health check (ADR-043): 200 when the app runs and the database answers, 503 otherwise. Used by
 * the Docker healthcheck, the deploy script and uptime monitoring. Never cached; reveals no
 * configuration beyond the release version.
 */
export async function GET() {
  await connection();
  const report = await checkHealth();
  return Response.json(report, {
    status: report.status === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
