import "server-only";

import { updateTag } from "next/cache";
import type { z } from "zod";

import { ActionFailure, fieldErrorsOf, type ActionResult } from "@/lib/action-result";
import { can, type PermissionAction, type Resource } from "@/lib/permissions";

import type { SessionUser } from "./schema";
import { getCurrentUser } from "./session";

/** Errors every admin mutation can return; forms translate them from `AdminForms.errors`. */
export type AdminActionError =
  | "invalid"
  | "forbidden"
  | "notFound"
  | "orderChanged"
  | "selfChange"
  | "lastSuperAdmin"
  | "userInactive"
  | "unknown";

type GuardedAction<TParsed, TData> = {
  /** Log prefix, e.g. "activities". */
  label: string;
  schema: z.ZodType<TParsed, unknown>;
  input: unknown;
  permission: [PermissionAction, Resource];
  /** Cache tags the change makes stale (`cacheTags`). */
  tags: readonly string[];
  run: (data: TParsed, user: SessionUser) => Promise<TData>;
};

/**
 * The admin mutation pipeline (AGENTS.md § 4): validate → authorize → run (the service writes the
 * change and its audit row in one transaction) → expire the cache tags with `updateTag`, so the
 * editor sees the change right away. Validation runs first so forms get field errors, but nothing
 * runs without the permission. A service `ActionFailure` becomes a typed result.
 */
export async function guardedAction<TParsed, TData = null>({
  label,
  schema,
  input,
  permission: [action, resource],
  tags,
  run,
}: GuardedAction<TParsed, TData>): Promise<ActionResult<TData, AdminActionError>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid", fieldErrors: fieldErrorsOf(parsed.error.issues) };
  }

  const user = await getCurrentUser();
  if (!user || !can(user, action, resource)) return { ok: false, error: "forbidden" };

  let data: TData;
  try {
    data = await run(parsed.data, user);
  } catch (error) {
    if (error instanceof ActionFailure) {
      return {
        ok: false,
        error: error.code as AdminActionError,
        fieldErrors: error.fieldErrors,
      };
    }
    console.error(`[${label}] ${action} ${resource} failed`, error);
    return { ok: false, error: "unknown" };
  }
  for (const tag of tags) updateTag(tag);
  return { ok: true, data };
}
