import { getTranslations } from "next-intl/server";

import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminUserMenu } from "@/components/admin/admin-user-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { adminLocale } from "@/config/admin-routes";
import { getCurrentUser } from "@/features/users/session";

import { navSectionsFor } from "./nav-sections";

/*
 * The parts of the shell that depend on the session. Each one reads the user inside its own
 * `<Suspense>` boundary (layout), so the frame streams first (Cache Components, ADR-025).
 */

export async function SidebarNav() {
  const sections = await navSectionsFor(await getCurrentUser());
  return <AdminNav sections={sections} variant="rail" />;
}

export async function MobileNav() {
  const [sections, t] = await Promise.all([
    navSectionsFor(await getCurrentUser()),
    getTranslations({ locale: adminLocale, namespace: "Admin" }),
  ]);
  return (
    <AdminMobileNav
      sections={sections}
      labels={{ open: t("openMenu"), title: t("menuTitle"), description: t("menuDescription") }}
    />
  );
}

export async function UserMenu() {
  const [user, t] = await Promise.all([
    getCurrentUser(),
    getTranslations({ locale: adminLocale, namespace: "Admin" }),
  ]);
  // Signed out mid-session: the page itself redirects; the menu just stays empty.
  if (!user) return null;
  return (
    <AdminUserMenu
      name={user.name}
      email={user.email}
      roleLabel={t(`role.${user.role}`)}
      labels={{ menu: t("userMenu"), viewSite: t("viewSite"), signOut: t("signOut") }}
    />
  );
}

export function NavSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-2">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-11 w-full rounded-lg" />
      ))}
    </div>
  );
}
