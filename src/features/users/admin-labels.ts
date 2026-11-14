import "server-only";

import { getTranslations } from "next-intl/server";

import { adminLocale } from "@/config/admin-routes";

import { userRoles, type UserRole } from "./schema";

/** Role names (`Admin.role`) for client forms, translated on the server. */
export async function roleLabels(): Promise<Record<UserRole, string>> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin.role" });
  return Object.fromEntries(userRoles.map((role) => [role, t(role)])) as Record<UserRole, string>;
}
