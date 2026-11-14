"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";

import { limits } from "@/config/limits";
import { fieldErrorsOf, type ActionResult } from "@/lib/action-result";
import { writeAuditLog } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { createRateLimiter } from "@/lib/rate-limit";

import { updateOwnName } from "./admin-service";
import { changePasswordSchema, profileFormSchema, type AuthError } from "./schema";
import { getCurrentUser } from "./session";

/*
 * "Akun saya": what every signed-in account may change about itself. No permission is needed
 * beyond being signed in and active; each action re-reads the session itself.
 */

/** Wrong current passwords per account, like failed sign-ins (a stolen session cannot guess). */
const passwordLimiter = createRateLimiter({
  limit: limits.auth.signInRateLimit,
  windowMs: limits.auth.signInWindowMs,
});

export async function updateProfileAction(
  input: unknown,
): Promise<ActionResult<null, "invalid" | "forbidden" | "unknown">> {
  const parsed = profileFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid", fieldErrors: fieldErrorsOf(parsed.error.issues) };
  }
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "forbidden" };
  try {
    await updateOwnName(user.id, parsed.data.name);
  } catch (error) {
    console.error("[account] profile update failed", error);
    return { ok: false, error: "unknown" };
  }
  return { ok: true, data: null };
}

/** Changes the own password; every other browser of the account is signed out. */
export async function changePasswordAction(
  input: unknown,
): Promise<ActionResult<null, AuthError | "forbidden">> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid", fieldErrors: fieldErrorsOf(parsed.error.issues) };
  }
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "forbidden" };
  const key = `user:${user.id}`;
  if (passwordLimiter.isBlocked(key)) return { ok: false, error: "rateLimited" };

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.password,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError && error.body?.code === "INVALID_PASSWORD") {
      passwordLimiter.hit(key);
      return {
        ok: false,
        error: "currentPasswordWrong",
        fieldErrors: { currentPassword: "currentPasswordWrong" },
      };
    }
    console.error("[account] password change failed", error);
    return { ok: false, error: "unknown" };
  }
  passwordLimiter.reset(key);
  await writeAuditLog(db, {
    actorId: user.id,
    action: "user.password",
    entityType: "user",
    entityId: user.id,
  });
  return { ok: true, data: null };
}
