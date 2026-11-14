import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";

import { adminRoutes } from "@/config/admin-routes";
import { limits } from "@/config/limits";
import { siteConfig } from "@/config/site";
import { db } from "@/db/client";
import { accounts, sessions, users, verifications } from "@/db/schema";
import { sendPasswordResetMail } from "@/features/users/mail";
import { userRoles } from "@/features/users/schema";
import { env } from "@/lib/env";
import { publicEnv } from "@/lib/public-env";

/**
 * Better Auth instance (ADR-025). No `server-only` import: `scripts/create-user.ts` runs it in
 * plain Node. Only server code may import it — UI goes through `features/users`.
 *
 * - Email + password only; self sign-up is disabled, accounts are created by a super admin.
 * - No public `/api/auth` route: Server Actions call `auth.api.*` directly, so there is no client
 *   bundle and no HTTP surface to rate-limit separately (our own limiter guards the actions).
 * - `role`, `unitId` and `isActive` are additional user fields that no request can set.
 * - Inactive accounts cannot start a session; the session guard also re-checks on every request.
 */
export const auth = betterAuth({
  appName: siteConfig.name,
  baseURL: publicEnv.NEXT_PUBLIC_SITE_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { users, sessions, accounts, verifications },
    transaction: true,
  }),
  user: {
    modelName: "users",
    additionalFields: {
      role: { type: [...userRoles], required: false, defaultValue: "editor", input: false },
      unitId: { type: "string", required: false, input: false },
      isActive: { type: "boolean", required: false, defaultValue: true, input: false },
    },
  },
  session: {
    modelName: "sessions",
    expiresIn: limits.auth.sessionDays * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  account: { modelName: "accounts" },
  // Reset tokens are stored hashed: a database read (backup, log) cannot be turned into a login.
  verification: { modelName: "verifications", storeIdentifier: "hashed" },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: limits.auth.passwordMin,
    maxPasswordLength: limits.auth.passwordMax,
    resetPasswordTokenExpiresIn: limits.auth.resetLinkMinutes * 60,
    // A reset proves control of the mailbox; every other browser is signed out.
    revokeSessionsOnPasswordReset: true,
    async sendResetPassword({ user, token }) {
      // Link straight to our page instead of Better Auth's redirect endpoint (not mounted).
      const url = new URL(adminRoutes.resetPassword, publicEnv.NEXT_PUBLIC_SITE_URL);
      url.searchParams.set("token", token);
      await sendPasswordResetMail({ email: user.email, name: user.name, url: url.toString() });
    },
  },
  databaseHooks: {
    session: {
      create: {
        async before(session) {
          const [user] = await db
            .select({ isActive: users.isActive })
            .from(users)
            .where(eq(users.id, session.userId));
          if (!user?.isActive) throw new APIError("FORBIDDEN", { message: "ACCOUNT_DISABLED" });
        },
        // Shown as "last signed in" in the Users module; a session starts only at sign-in.
        async after(session) {
          await db
            .update(users)
            .set({ lastSignInAt: new Date() })
            .where(eq(users.id, session.userId));
        },
      },
    },
  },
  advanced: {
    cookiePrefix: "bec",
    database: { generateId: "uuid" },
    // Behind Cloudflare the client IP arrives in this header (stored on the session for audit).
    ipAddress: { ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"] },
  },
  telemetry: { enabled: false },
  // Must stay last: writes Set-Cookie from `auth.api` calls into Next's cookie store.
  plugins: [nextCookies()],
});

export type Auth = typeof auth;
