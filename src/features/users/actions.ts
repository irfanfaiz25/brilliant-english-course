"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { adminRoutes, safeAdminRedirect } from "@/config/admin-routes";
import { limits } from "@/config/limits";
import { fieldErrorsOf, type ActionResult } from "@/lib/action-result";
import { auth } from "@/lib/auth";
import { clientIp, createRateLimiter, isLocalOrUnknownIp } from "@/lib/rate-limit";

import { forgotPasswordSchema, resetPasswordSchema, signInSchema, type AuthError } from "./schema";

/*
 * Staff authentication (ADR-025). Each action validates with the form's Zod schema, rate-limits
 * by email and client IP, then calls Better Auth on the server; `nextCookies()` writes the session
 * cookie. Messages are codes the forms translate (`Auth.errors`).
 */

const signInLimiter = createRateLimiter({
  limit: limits.auth.signInRateLimit,
  windowMs: limits.auth.signInWindowMs,
});
const resetLimiter = createRateLimiter({
  limit: limits.auth.resetRateLimit,
  windowMs: limits.auth.resetWindowMs,
});

/**
 * Limiter keys for a request: per email and, behind a proxy, per client IP. Local runs have only a
 * loopback or unknown address shared by every request, so they are limited by email alone; behind
 * Cloudflare the real IP is always present.
 */
async function limitKeys(email: string): Promise<string[]> {
  const ip = clientIp(await headers());
  return isLocalOrUnknownIp(ip) ? [`email:${email}`] : [`email:${email}`, `ip:${ip}`];
}

export async function signIn(
  input: unknown,
  next: string | null,
): Promise<ActionResult<never, AuthError>> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid", fieldErrors: fieldErrorsOf(parsed.error.issues) };
  }
  const { email, password } = parsed.data;

  // Only failed attempts count: one IP cannot guess many passwords and many IPs cannot hammer one
  // account, while staff who sign in often are never locked out.
  const keys = await limitKeys(email);
  if (keys.some((key) => signInLimiter.isBlocked(key))) return { ok: false, error: "rateLimited" };
  const failed = (error: AuthError): ActionResult<never, AuthError> => {
    for (const key of keys) signInLimiter.hit(key);
    return { ok: false, error };
  };

  try {
    await auth.api.signInEmail({ body: { email, password }, headers: await headers() });
  } catch (error) {
    if (error instanceof APIError && error.message === "ACCOUNT_DISABLED") {
      return failed("accountDisabled");
    }
    if (error instanceof APIError && error.statusCode === 401) {
      return failed("invalidCredentials");
    }
    console.error("[auth] sign-in failed", error);
    return { ok: false, error: "unknown" };
  }
  signInLimiter.reset(`email:${email}`);
  // Outside try/catch: `redirect` works by throwing.
  redirect(safeAdminRedirect(next));
}

export async function signOut(): Promise<void> {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // Already signed out or the session expired: the cookie is cleared either way.
  }
  redirect(adminRoutes.signIn);
}

/**
 * Always answers "sent" for a valid email, whether or not an account exists, so the form cannot
 * be used to discover staff addresses.
 */
export async function requestPasswordReset(input: unknown): Promise<ActionResult<null, AuthError>> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid", fieldErrors: fieldErrorsOf(parsed.error.issues) };
  }
  const { email } = parsed.data;
  // Every request counts here: each one may send an email.
  const allowed = (await limitKeys(email)).map((key) => resetLimiter.hit(key));
  if (allowed.includes(false)) return { ok: false, error: "rateLimited" };

  try {
    await auth.api.requestPasswordReset({ body: { email }, headers: await headers() });
  } catch (error) {
    console.error("[auth] password reset request failed", error);
    return { ok: false, error: "unknown" };
  }
  return { ok: true, data: null };
}

export async function resetPassword(input: unknown): Promise<ActionResult<null, AuthError>> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = fieldErrorsOf(parsed.error.issues);
    const error = fieldErrors.token ? "tokenInvalid" : "invalid";
    return { ok: false, error, fieldErrors };
  }
  const { token, password } = parsed.data;

  try {
    await auth.api.resetPassword({
      body: { token, newPassword: password },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError && error.statusCode === 400) {
      return { ok: false, error: "tokenInvalid" };
    }
    console.error("[auth] password reset failed", error);
    return { ok: false, error: "unknown" };
  }
  return { ok: true, data: null };
}
