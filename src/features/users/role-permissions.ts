import "server-only";

import { readSetting } from "@/features/settings/queries";
import { defaultGrantsFor, type RoleGrants } from "@/lib/permissions";

import { rolePermissionsSchema } from "./schema";

/** The code matrix of the configurable roles: what applies until a super admin saves. */
export const defaultRoleGrants = (): RoleGrants => ({
  admin: defaultGrantsFor("admin"),
  editor: defaultGrantsFor("editor"),
});

/**
 * The configured grants of `admin` and `editor` (ADR-036). Cached with the settings, so a request
 * reads them without a query; saving them expires the `settings` tag. An unreadable document
 * falls back to the defaults (logged by `readSetting`).
 */
export async function getRoleGrants(): Promise<RoleGrants> {
  return readSetting("rolePermissions", rolePermissionsSchema, defaultRoleGrants());
}
