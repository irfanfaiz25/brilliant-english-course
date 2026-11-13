import "server-only";

import { isNull, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { posts } from "@/db/schema";
import type { SessionUser } from "@/features/users/schema";
import { assertCan } from "@/lib/permissions";

/** Posts by status for the admin overview (published, drafts), checked against the caller. */
export async function countPostsByStatus(
  actor: SessionUser,
): Promise<{ published: number; draft: number }> {
  assertCan(actor, "read", "blog");
  const rows = await db
    .select({ status: posts.status, count: sql<number>`count(*)::int` })
    .from(posts)
    .where(isNull(posts.deletedAt))
    .groupBy(posts.status);
  const count = (status: string) => rows.find((row) => row.status === status)?.count ?? 0;
  return { published: count("published"), draft: count("draft") };
}
