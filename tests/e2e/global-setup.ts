import { execFileSync } from "node:child_process";

import nextEnv from "@next/env";
import pg from "pg";

import { E2E_PASSWORD, e2eLead, e2eProjects, e2eUsers } from "./auth-users";

/**
 * Creates (or resets) the E2E staff accounts in the database the app under test uses, through the
 * same CLI staff use (`pnpm auth:create-user`), then deactivates the "disabled" ones. Needs a
 * migrated local or CI database; never point E2E at a shared or production database.
 */
export default async function globalSetup() {
  nextEnv.loadEnvConfig(process.cwd());
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set for the E2E auth accounts.");

  const managed: string[] = [];
  const disabled: string[] = [];
  for (const project of e2eProjects) {
    for (const user of Object.values(e2eUsers(project))) {
      managed.push(user.email);
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
    // Only the accounts above: accounts a spec creates (the Users spec's invitees) keep the
    // status the spec left them in.
    await client.query(
      "update users set is_active = (email <> all($2::text[])) where email = any($1::text[])",
      [managed, disabled],
    );
    // Role permissions start from the code defaults on every run (the access spec changes them).
    await client.query("delete from settings where key = 'rolePermissions'");
    await resetLeadFixture(client);
  } finally {
    await client.end();
  }
}

/**
 * Puts the lead the admin leads spec works on back to a fresh application: status `new`, no
 * assignee, notes or quota reservation, in a village no other spec reads (Singajaya, Kab. Bogor).
 */
async function resetLeadFixture(client: pg.Client) {
  const { rows } = await client.query<{ id: string }>(
    `insert into partner_leads
       (reference, full_name, whatsapp, background, space, motivation, village_code, locale)
     values ($1, $2, '6281200009999', 'educator', 'ready', 'Fixture for the E2E specs.', '32.01.06.2003', 'id')
     on conflict (reference) do update set
       status = 'new', assigned_to_id = null, unit_id = null, deleted_at = null,
       created_at = now(), updated_at = now()
     returning id`,
    [e2eLead.reference, e2eLead.name],
  );
  const leadId = rows[0]?.id;
  await client.query("delete from partner_lead_notes where lead_id = $1", [leadId]);
  await client.query("delete from quota_reservations where lead_id = $1", [leadId]);
  await client.query(
    "delete from audit_log where entity_type = 'partner_lead' and entity_id = $1::text",
    [leadId],
  );
}
