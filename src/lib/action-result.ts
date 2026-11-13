/**
 * Result of a Server Action (AGENTS.md § 4): actions never throw raw errors to the client.
 * `error` is a stable code the UI translates; `fieldErrors` maps field names to codes.
 */
export type ActionResult<TData, TError extends string = string> =
  | { ok: true; data: TData }
  | { ok: false; error: TError; fieldErrors?: Partial<Record<string, string>> };
