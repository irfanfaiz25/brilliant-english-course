import "server-only";

import { and, count, desc, eq, gt, ilike, max, or, sql, type SQL } from "drizzle-orm";

import { limits } from "@/config/limits";
import { db } from "@/db/client";
import { accounts, sessions, units, users, verifications } from "@/db/schema";
import { assertCan } from "@/lib/permissions";

import { accountStatus } from "./rules";
import {
  userRoles,
  type AccountStatus,
  type SessionUser,
  type UserFormInput,
  type UserRole,
} from "./schema";

/*
 * Admin reads of accounts (Phase 4g): permission-checked, uncached (data access layer, ADR-025).
 * Password hashes and tokens never leave this module; only whether a password exists.
 */

export type AdminUserFilter = {
  /** Name or email, case-insensitive. */
  query: string;
  role: UserRole | null;
  page: number;
};

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Unit of a `mitra` account; `deleted` when the unit was removed since. */
  unit: { name: string; deleted: boolean } | null;
  status: AccountStatus;
  lastSignInAt: Date | null;
};

export type AdminUserList = {
  rows: AdminUserRow[];
  total: number;
  pageCount: number;
  /** Accounts per role and in all, for the filter chips (search applied). */
  counts: Record<UserRole | "all", number>;
};

/**
 * Whether an account has a password: the credential account of Better Auth. Inside a select,
 * Drizzle writes columns without their table, so the outer `users.id` is named in full here (a
 * bare "id" would resolve to `accounts.id` inside the subquery).
 */
const hasPasswordSql = sql<boolean>`exists (select 1 from ${accounts} where ${accounts.userId} = "users"."id" and ${accounts.providerId} = 'credential')`;

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (match) => `\\${match}`);

/** One page of accounts, newest first, filtered by search and role. */
export async function getAdminUsers(
  actor: SessionUser,
  filter: AdminUserFilter,
): Promise<AdminUserList> {
  assertCan(actor, "read", "users");
  const size = limits.users.pageSize;
  const search: SQL | undefined = filter.query
    ? or(
        ilike(users.name, `%${escapeLike(filter.query)}%`),
        ilike(users.email, `%${escapeLike(filter.query)}%`),
      )
    : undefined;
  const where = and(search, filter.role ? eq(users.role, filter.role) : undefined);

  const [rows, perRole] = await Promise.all([
    db
      .select({
        user: users,
        unitName: units.name,
        unitDeletedAt: units.deletedAt,
        hasPassword: hasPasswordSql,
      })
      .from(users)
      .leftJoin(units, eq(units.id, users.unitId))
      .where(where)
      .orderBy(desc(users.createdAt), users.email)
      .limit(size)
      .offset((filter.page - 1) * size),
    db.select({ role: users.role, total: count() }).from(users).where(search).groupBy(users.role),
  ]);

  const counts = Object.fromEntries(
    userRoles.map((role) => [role, perRole.find((row) => row.role === role)?.total ?? 0]),
  ) as Record<UserRole, number>;
  const all = userRoles.reduce((sum, role) => sum + counts[role], 0);
  const total = filter.role ? counts[filter.role] : all;

  return {
    total,
    pageCount: Math.max(1, Math.ceil(total / size)),
    counts: { ...counts, all },
    rows: rows.map(({ user, unitName, unitDeletedAt, hasPassword }) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      unit: unitName ? { name: unitName, deleted: unitDeletedAt !== null } : null,
      status: accountStatus({ isActive: user.isActive, hasPassword }),
      lastSignInAt: user.lastSignInAt,
    })),
  };
}

export type UserForEdit = {
  values: UserFormInput;
  status: AccountStatus;
  hasPassword: boolean;
  lastSignInAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  /** Browsers signed in right now (unexpired sessions). */
  activeSessions: number;
  /** When the newest unused activation/reset link expires, if one is still valid. */
  linkExpiresAt: Date | null;
};

/** One account for its edit page, or `null` when it does not exist. */
export async function getUserForEdit(actor: SessionUser, id: string): Promise<UserForEdit | null> {
  assertCan(actor, "read", "users");
  const now = new Date();
  const [row] = await db
    .select({ user: users, hasPassword: hasPasswordSql })
    .from(users)
    .where(eq(users.id, id));
  if (!row) return null;
  const [[sessionCount], [link]] = await Promise.all([
    db
      .select({ total: count() })
      .from(sessions)
      .where(and(eq(sessions.userId, id), gt(sessions.expiresAt, now))),
    db
      .select({ expiresAt: max(verifications.expiresAt) })
      .from(verifications)
      .where(and(eq(verifications.value, id), gt(verifications.expiresAt, now))),
  ]);
  const { user, hasPassword } = row;
  return {
    values: {
      name: user.name,
      email: user.email,
      role: user.role,
      unitId: user.unitId ?? "",
    },
    status: accountStatus({ isActive: user.isActive, hasPassword }),
    hasPassword,
    lastSignInAt: user.lastSignInAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    activeSessions: sessionCount?.total ?? 0,
    linkExpiresAt: link?.expiresAt ?? null,
  };
}

export type OwnAccount = {
  name: string;
  email: string;
  role: UserRole;
  unitName: string | null;
  lastSignInAt: Date | null;
  updatedAt: Date;
};

/** The signed-in account for "Akun saya" (no permission beyond being signed in). */
export async function getOwnAccount(user: SessionUser): Promise<OwnAccount | null> {
  const [row] = await db
    .select({ user: users, unitName: units.name })
    .from(users)
    .leftJoin(units, eq(units.id, users.unitId))
    .where(eq(users.id, user.id));
  if (!row) return null;
  return {
    name: row.user.name,
    email: row.user.email,
    role: row.user.role,
    unitName: row.unitName,
    lastSignInAt: row.user.lastSignInAt,
    updatedAt: row.user.updatedAt,
  };
}
