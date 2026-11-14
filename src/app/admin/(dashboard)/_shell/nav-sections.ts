import "server-only";

import { getTranslations } from "next-intl/server";

import type { AdminNavSection } from "@/components/admin/admin-nav";
import { adminLocale } from "@/config/admin-routes";
import { adminNavigation } from "@/config/admin-navigation";
import type { SessionUser } from "@/features/users/schema";
import { can } from "@/lib/permissions";

/**
 * The navigation a user may see: items whose resource they can read, labelled on the server so
 * no message namespace ships to the browser. Empty groups are dropped. Hiding links is only
 * convenience; every page checks the permission again.
 */
export async function navSectionsFor(user: SessionUser | null): Promise<AdminNavSection[]> {
  const t = await getTranslations({ locale: adminLocale, namespace: "Admin" });
  return adminNavigation.flatMap((group) => {
    const items = group.items
      .filter((item) => can(user, "read", item.resource))
      .map((item) => ({
        key: item.key,
        href: item.href,
        icon: item.icon,
        label: t(`nav.items.${item.key}`),
      }));
    return items.length ? [{ key: group.key, label: t(`nav.groups.${group.key}`), items }] : [];
  });
}
