import type { AccountStatus, UserRole } from "./schema";

/*
 * Rules for changing accounts (Phase 4g, ADR-035). Pure, so the service and the UI apply the same
 * checks and unit tests cover them without a database.
 */

type AccountState = { id: string; role: UserRole; isActive: boolean };

export type AccountChangeError = "selfChange" | "lastSuperAdmin";

/**
 * Why `before` may not become `after`, or `null` when it may:
 * - nobody changes their own role or switches themselves off (a slip would lock them out);
 * - the last active super admin stays one, or nobody could manage accounts any more.
 */
export function accountChangeError({
  actorId,
  before,
  after,
  activeSuperAdmins,
}: {
  actorId: string;
  before: AccountState;
  after: Pick<AccountState, "role" | "isActive">;
  /** Active super admins right now, the account itself included. */
  activeSuperAdmins: number;
}): AccountChangeError | null {
  const losesAccess = after.role !== before.role || (before.isActive && !after.isActive);
  if (before.id === actorId && losesAccess) return "selfChange";
  const wasActiveSuperAdmin = before.role === "super_admin" && before.isActive;
  const staysActiveSuperAdmin = after.role === "super_admin" && after.isActive;
  if (wasActiveSuperAdmin && !staysActiveSuperAdmin && activeSuperAdmins <= 1) {
    return "lastSuperAdmin";
  }
  return null;
}

/** An account that has never set a password is still waiting for its activation link. */
export function accountStatus({
  isActive,
  hasPassword,
}: {
  isActive: boolean;
  hasPassword: boolean;
}): AccountStatus {
  if (!isActive) return "disabled";
  return hasPassword ? "active" : "invited";
}

/** The kind of link a super admin sends: set a first password, or replace a forgotten one. */
export const accessLinkKind = (hasPassword: boolean) => (hasPassword ? "reset" : "activation");
export type AccessLinkKind = ReturnType<typeof accessLinkKind>;
