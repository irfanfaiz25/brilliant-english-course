/**
 * Creates a staff account, or resets an existing account's password (ADR-025).
 *
 *   pnpm auth:create-user --email ana@bec.id --name "Ana" --role super_admin
 *   pnpm auth:create-user --email ana@bec.id --reset-password
 *
 * Self sign-up is disabled, so this is how the first super admin is created; later accounts come
 * from the Users module (Phase 4g). The password is read from `BEC_USER_PASSWORD` when set (CI,
 * E2E), otherwise a strong one is generated and printed once. Run it against local or CI
 * databases only; production accounts are created through the deploy pipeline (Phase 8).
 */
import { randomBytes } from "node:crypto";
import { parseArgs } from "node:util";

import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

const USAGE =
  "Usage: pnpm auth:create-user --email <email> [--name <name>] [--role <role>] [--unit <unitId>] [--reset-password]";

async function main() {
  const { values } = parseArgs({
    options: {
      email: { type: "string" },
      name: { type: "string" },
      role: { type: "string", default: "editor" },
      unit: { type: "string" },
      "reset-password": { type: "boolean", default: false },
    },
  });

  // Imported after the env is loaded: these modules validate it on import.
  const [{ auth }, { closeDb }, { userRoles, signInSchema }, { limits }] = await Promise.all([
    import("@/lib/auth"),
    import("@/db/client"),
    import("@/features/users/schema"),
    import("@/config/limits"),
  ]);

  const email = signInSchema.shape.email.safeParse(values.email ?? "");
  if (!email.success) throw new Error(`A valid --email is required.\n${USAGE}`);
  const role = userRoles.find((candidate) => candidate === values.role);
  if (!role) throw new Error(`--role must be one of: ${userRoles.join(", ")}`);
  if (role === "mitra" && !values.unit) throw new Error("A mitra account needs --unit <unitId>.");

  const generated = !process.env.BEC_USER_PASSWORD;
  const password = process.env.BEC_USER_PASSWORD ?? randomBytes(15).toString("base64url");
  if (password.length < limits.auth.passwordMin) {
    throw new Error(`The password must have at least ${limits.auth.passwordMin} characters.`);
  }

  const ctx = await auth.$context;
  const hash = await ctx.password.hash(password);
  const existing = await ctx.internalAdapter.findUserByEmail(email.data, { includeAccounts: true });

  if (existing) {
    if (!values["reset-password"]) {
      throw new Error(`${email.data} already exists. Pass --reset-password to set a new password.`);
    }
    const credential = existing.accounts.find((account) => account.providerId === "credential");
    if (credential) {
      await ctx.internalAdapter.updatePassword(existing.user.id, hash);
    } else {
      await ctx.internalAdapter.linkAccount({
        userId: existing.user.id,
        providerId: "credential",
        accountId: existing.user.id,
        password: hash,
      });
    }
    // A reset signs the account out everywhere, like the self-service reset.
    await ctx.internalAdapter.deleteUserSessions(existing.user.id);
    console.log(`Password reset for ${email.data}.`);
  } else {
    const user = await ctx.internalAdapter.createUser(
      {
        email: email.data,
        name: values.name?.trim() || email.data.split("@")[0],
        emailVerified: true,
        role,
        unitId: values.unit ?? null,
        isActive: true,
      },
      { method: "admin" },
    );
    await ctx.internalAdapter.linkAccount({
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: hash,
    });
    console.log(`Created ${role} ${email.data}.`);
  }
  if (generated) console.log(`Password (shown once, ask the user to change it): ${password}`);

  await closeDb();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
