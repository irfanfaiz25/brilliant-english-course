import "server-only";

import { randomBytes } from "node:crypto";

import { and, count, eq, isNull, ne, sql } from "drizzle-orm";

import { adminRoutes } from "@/config/admin-routes";
import { limits } from "@/config/limits";
import type { Database } from "@/db/client";
import { db } from "@/db/client";
import { accounts, sessions, units, users, verifications } from "@/db/schema";
import { ActionFailure } from "@/lib/action-result";
import { writeAuditLog } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { publicEnv } from "@/lib/public-env";

import { accessLinkKind, accountChangeError, type AccessLinkKind } from "./rules";
import type { UserForm } from "./schema";

/*
 * Admin writes of accounts (Phase 4g, ADR-035). Only super admins reach these (`users` grants).
 * Every change commits with its audit row; links and passwords never appear in the audit log.
 */

type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

export type AccessLink = { url: string; kind: AccessLinkKind; expiresAt: Date };

/** Field error for an email another account already uses (any letter case). */
async function assertEmailFree(tx: Tx, email: string, exceptId?: string) {
  const [taken] = await tx
    .select({ id: users.id })
    .from(users)
    .where(
      and(sql`lower(${users.email}) = ${email}`, exceptId ? ne(users.id, exceptId) : undefined),
    );
  if (taken) throw new ActionFailure("invalid", { email: "emailTaken" });
}

/** Field error unless a `mitra` account's unit exists and is not deleted. */
async function assertUnitLive(tx: Tx, unitId: string | null) {
  if (!unitId) return;
  const [unit] = await tx
    .select({ id: units.id })
    .from(units)
    .where(and(eq(units.id, unitId), isNull(units.deletedAt)));
  if (!unit) throw new ActionFailure("invalid", { unitId: "unitMissing" });
}

/**
 * Active super admins, locked until the transaction ends: two requests that each demote "another"
 * super admin cannot both pass the last-super-admin check.
 */
async function lockActiveSuperAdmins(tx: Tx) {
  const rows = await tx
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, "super_admin"), eq(users.isActive, true)))
    .for("update");
  return rows.length;
}

async function hasPassword(executor: Pick<Database, "select">, userId: string) {
  const [row] = await executor
    .select({ total: count() })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "credential")));
  return (row?.total ?? 0) > 0;
}

/**
 * A single-use link to set a password, valid `limits.auth.accessLinkHours`. It is a Better Auth
 * reset token (stored hashed), so the existing reset flow consumes it; earlier links of the
 * account stop working. Accounts without a password get the activation page, others the reset
 * page.
 */
async function createAccessLink(userId: string): Promise<AccessLink> {
  const kind = accessLinkKind(await hasPassword(db, userId));
  const token = randomBytes(18).toString("base64url");
  const expiresAt = new Date(Date.now() + limits.auth.accessLinkHours * 60 * 60 * 1000);
  // Reset tokens are the only verifications keyed to a user id (their value).
  await db.delete(verifications).where(eq(verifications.value, userId));
  const context = await auth.$context;
  await context.internalAdapter.createVerificationValue({
    identifier: `reset-password:${token}`,
    value: userId,
    expiresAt,
  });
  const page = kind === "activation" ? adminRoutes.activate : adminRoutes.resetPassword;
  const url = new URL(page, publicEnv.NEXT_PUBLIC_SITE_URL);
  url.searchParams.set("token", token);
  return { url: url.toString(), kind, expiresAt };
}

/** Creates an account without a password and returns its activation link. */
export async function createUser(
  form: UserForm,
  actorId: string,
): Promise<{ id: string; link: AccessLink }> {
  const created = await db.transaction(async (tx) => {
    await assertEmailFree(tx, form.email);
    await assertUnitLive(tx, form.unitId);
    const [row] = await tx
      .insert(users)
      .values({ ...form, emailVerified: true, isActive: true })
      .returning({ id: users.id });
    if (!row) throw new Error("User insert returned no row");
    await writeAuditLog(tx, {
      actorId,
      action: "user.create",
      entityType: "user",
      entityId: row.id,
      changes: { after: form },
    });
    return row;
  });
  return { id: created.id, link: await createAccessLink(created.id) };
}

/** Saves name, email, role and unit, keeping the account-change rules (`rules.ts`). */
export async function updateUser(id: string, form: UserForm, actorId: string) {
  await db.transaction(async (tx) => {
    const activeSuperAdmins = await lockActiveSuperAdmins(tx);
    const [before] = await tx.select().from(users).where(eq(users.id, id)).for("update");
    if (!before) throw new ActionFailure("notFound");
    const rule = accountChangeError({
      actorId,
      before,
      after: { role: form.role, isActive: before.isActive },
      activeSuperAdmins,
    });
    if (rule) throw new ActionFailure(rule);
    await assertEmailFree(tx, form.email, id);
    await assertUnitLive(tx, form.unitId);
    await tx
      .update(users)
      .set({ ...form, updatedAt: new Date() })
      .where(eq(users.id, id));
    await writeAuditLog(tx, {
      actorId,
      action: "user.update",
      entityType: "user",
      entityId: id,
      changes: {
        before: {
          name: before.name,
          email: before.email,
          role: before.role,
          unitId: before.unitId,
        },
        after: form,
      },
    });
  });
}

/**
 * Switches an account on or off. Switching off ends every session and unused link of the account
 * at once; switching on does not restore them.
 */
export async function setUserActive(id: string, isActive: boolean, actorId: string) {
  await db.transaction(async (tx) => {
    const activeSuperAdmins = await lockActiveSuperAdmins(tx);
    const [before] = await tx.select().from(users).where(eq(users.id, id)).for("update");
    if (!before) throw new ActionFailure("notFound");
    if (before.isActive === isActive) return;
    const rule = accountChangeError({
      actorId,
      before,
      after: { role: before.role, isActive },
      activeSuperAdmins,
    });
    if (rule) throw new ActionFailure(rule);
    await tx.update(users).set({ isActive, updatedAt: new Date() }).where(eq(users.id, id));
    if (!isActive) {
      await tx.delete(sessions).where(eq(sessions.userId, id));
      await tx.delete(verifications).where(eq(verifications.value, id));
    }
    await writeAuditLog(tx, {
      actorId,
      action: isActive ? "user.activate" : "user.deactivate",
      entityType: "user",
      entityId: id,
      changes: { isActive },
    });
  });
}

/** A new activation or reset link for an active account; the audit row records its kind only. */
export async function createUserAccessLink(id: string, actorId: string): Promise<AccessLink> {
  const [user] = await db.select({ isActive: users.isActive }).from(users).where(eq(users.id, id));
  if (!user) throw new ActionFailure("notFound");
  if (!user.isActive) throw new ActionFailure("userInactive");
  const link = await createAccessLink(id);
  await writeAuditLog(db, {
    actorId,
    action: "user.link",
    entityType: "user",
    entityId: id,
    changes: { kind: link.kind, expiresAt: link.expiresAt.toISOString() },
  });
  return link;
}

/** The signed-in account renames itself ("Akun saya"). */
export async function updateOwnName(userId: string, name: string) {
  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(users)
      .set({ name, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({ id: users.id });
    if (!updated) throw new ActionFailure("notFound");
    await writeAuditLog(tx, {
      actorId: userId,
      action: "user.profile",
      entityType: "user",
      entityId: userId,
      changes: { after: { name } },
    });
  });
}
