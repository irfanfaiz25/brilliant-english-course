/**
 * Result of a Server Action (AGENTS.md § 4): actions never throw raw errors to the client.
 * `error` is a stable code the UI translates; `fieldErrors` maps field names to codes.
 */
export type ActionResult<TData, TError extends string = string> =
  | { ok: true; data: TData }
  | { ok: false; error: TError; fieldErrors?: Partial<Record<string, string>> };

/** Field errors of a failed Zod parse, keyed by dotted path (`officeHours.0.closes`). */
export function fieldErrorsOf(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
) {
  return Object.fromEntries(issues.map((issue) => [issue.path.join("."), issue.message]));
}

/**
 * Thrown by a service when a rule fails that the action should report as a typed result (a record
 * that disappeared, an age range that overlaps another level). Actions turn it into `{ ok: false }`.
 */
export class ActionFailure<TError extends string = string> extends Error {
  constructor(
    readonly code: TError,
    readonly fieldErrors?: Partial<Record<string, string>>,
  ) {
    super(code);
    this.name = "ActionFailure";
  }
}
