import { execFileSync } from "node:child_process";

import nextEnv from "@next/env";
import pg from "pg";

import { E2E_PASSWORD, e2eProjects, e2eUsers } from "./auth-users";

/**
 * Creates (or resets) the E2E staff accounts in the database the app under test uses, through the
 * same CLI staff use (`pnpm auth:create-user`), then deactivates the "disabled" ones. Needs a
 * migrated local or CI database; never point E2E at a shared or production database.
 */
export default async function globalSetup() {
  nextEnv.loadEnvConfig(process.cwd());
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set for the E2E auth accounts.");

  const disabled: string[] = [];
  for (const project of e2eProjects) {
    for (const user of Object.values(e2eUsers(project))) {
      execFileSync(
        "pnpm",
        [
          "--silent",
          "auth:create-user",
          "--email",
          user.email,
          "--name",
          user.name,
          "--role",
          user.role,
          "--reset-password",
        ],
        { env: { ...process.env, BEC_USER_PASSWORD: E2E_PASSWORD }, stdio: "pipe" },
      );
    }
    disabled.push(e2eUsers(project).disabled.email);
  }

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(
      "update users set is_active = (email <> all($1::text[])) where email like 'e2e-%@bec.test'",
      [disabled],
    );
  } finally {
    await client.end();
  }
}
